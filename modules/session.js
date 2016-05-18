'use strict';
// 在缓存服务器上存储 session，重启也不影响回话状态
exports.makesid = create_session_id;
exports.check4sid = check_get_session_id;
exports.checksid = check_session_id;
exports.getsid = get_session_id;

const crypto = require('crypto'),
      nmc = require('./nmcache');

function getkey(uid) {
    return ['wxpush', uid].join('-');
}

function create_session_id(uid, ip, callback) {
    // sessionid 规则: ip-time-usermobile ,简单加密： 0.-9 <=> 几组字母
    var t = Date.now(),
        sid = [ip, t, uid].join('-');

    console.log('create_session_id', sid);
    nmc.set(getkey(uid), sid.toLowerCase(), 0, function(errcode,data) {
        callback({e:0, s:encrypt(sid)});
    });
}

function check_get_session_id(uid, ip, sid, callback) {
    var osid=decrypt(sid);
    nmc.get(getkey(uid), function(e,v) {
        console.log('check_get_session_id', sid, v, osid);
        if( v === osid ) {
            create_session_id(uid, ip, callback)
        }else{
            // 验证失败
            callback({e:1, s:'session不匹配'});
        }
    });
}

function check_session_id(uid, sid, callback) {
    var osid = decrypt(sid);
    nmc.get(getkey(uid), function(e,v) {
        console.log('check_session_id:%s[%s]%s', sid, osid, v);
        callback(v === osid);
    });
}

function get_session_id(uid, callback) {
    nmc.get(getkey(uid), function(e,v) {
        callback(v);
    });
}

// 某IP ::ffff:123.151.42.50-1450852072902-13701075403 encrypt 出错，漏掉了
// encrypt decrypt
// 码表
var encodes ={
    0:'H',
    1:'L',
    2:'v',
    3:'O',
    4:'f',
    5:'r',
    6:'U',
    7:'X',
    8:'M',
    9:'s',
    '.':'g',
    '-':'Q',
    ':':'m',
    a:0,
    b:1,
    c:2,
    d:3,
    e:4,
    f:5
}, decodes = {};

for(var x in encodes) {
    decodes[encodes[x]] = x;
}

console.log('decodes',decodes);

function encrypt(s) {
    s = s.toLowerCase();
    var r=[];
    for(var x in s) {
        r.push(encodes[s[x]]);
    }
    return r.join('');
}

function decrypt(s) {
    var r=[];
    for(var x in s) {
        r.push(decodes[s[x]]);
    }
    return r.join('');
}
