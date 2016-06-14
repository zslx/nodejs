'use strict';
console.log('模块加载时只执行一次？wsck');

const crypto = require('crypto'),
      cryptojs = require('crypto-js'); // crypto-js 与 node-crypto 不兼容

const mail = require('../m/mail');

exports.chklogin = chklogin;
exports.login = login;
exports.register = register;
exports.home = home;
exports.getseckey = getseckey;

var seckeys={};                 // 一次性的随机key，共享变量，放在中央缓存中
var loginsessions={};           // 维护登录状态
var userinfo={                // in db
    zsl:{pwd:'123',ws:null},
    xyz:{pwd:'abc'},
    wby:{pwd:'sprite'}
};

let decipherjs = (jo, ws)=>{          // 第三方模块 crypto-js
    var des = cryptojs.AES.decrypt(jo.aes, jo.pwd);
    var result= des.toString(cryptojs.enc.Utf8); // 必须指定编码
    ws.brocast('后台:'+result);
};

function register(ws, req) {
    console.log('注册信息',req);
    console.log('register info', userinfo);
    
    const secuser = req.u,
          ki = req.i;

    if(seckeys[ki]!==undefined) {
        var kv = seckeys[ki];
    }else{
        // 非法访问
        ws.send('非法访问');
        return;
    }

    // 必须指定编码
    const user = cryptojs.AES.decrypt(secuser, kv).toString(cryptojs.enc.Utf8);
    let uo = userinfo[user];
    if(uo !== undefined){
        ws.send('用户已经存在');
        return;
    }
    console.log(`register new user ${user}`);
    // 邮件注册、手机号注册、微信授权注册
    // 创建密码
    crypto.randomBytes(4, (err, buf) => {
        console.log(`${buf.length}bytes random str:${buf.toString('hex')}`);
        let html = [`登录名：${user}`],
            urldes = `<a href="http://${global.h5server}:${global.cfg.port}/web/login" target="_blank">立刻去登录</a>`;
        html.push(`密码：${buf.toString('hex')}`);
        html.push(urldes);
        mail.send(user, '一封未读邮件', html.join('<br>'),function(info){
            console.log('mail result:',info.response);
            ws.send(['registerOK', secuser].join('\r\n'));
        });
    });
    
    console.log('delete seckey',ki);
    delete seckeys[ki];
    // ws.send(['registerOK', secuser].join('\r\n'));
}

function home(ws, req) {
    console.log('处理数据',req);
    
    if(req.md5!==undefined) {
        let md5 = crypto.createHash('md5').update(req.src,'utf8').digest('hex');
        ws.brocast([req.src, md5].join(' : '));
    }else if(req.aes!==undefined) {
        decipherjs(req, ws);
    }
}

function login(ws, req) {
    console.log('登录信息',req);
    console.log('login info', userinfo);
    
    const secuser = req.u,
          secpwd = req.p,
          ki = req.i;

    if(seckeys[ki]!==undefined) {
        var kv = seckeys[ki];
    }else{
        // 非法登录
        ws.send('登录错误');
        return;
    }

    // 必须指定编码
    const user = cryptojs.AES.decrypt(secuser, kv).toString(cryptojs.enc.Utf8);
    let uo = userinfo[user];
    if(uo === undefined){
        ws.send('用户名错误');
        return;
    }
    if(md5(uo.pwd+kv) !== secpwd){
        ws.send('密码错误');
        return;
    }

    crypto.randomBytes(16, (err, buf) => {
        if (err) {
            console.log('randomBytes err:',err);
        }else{
            let session = buf.toString('hex');
            console.log(`${buf.length}bytes random str:${session}`);
            console.log('delete seckey',ki);
            delete seckeys[ki];
            loginsessions[session] = {user, ws};
            uo.ws = ws;
            ws.send(['loginOK',session].join('\r\n'));
        }
    });    
}

function logout(ws, req) {
    // delete loginsessions[req.d]; // 超时自动清除
}

function chklogin(ws, req) {
    console.log('登录状态检查', req);
    // 正确的 sessionStorage 存储的登录信息
    let us = loginsessions[req.d];
    if(us === undefined) {
        ws.send('loginInvalid\r\n err session');
        return false;
    }
    let uo = userinfo[us.user];
    if(uo === undefined) {
        ws.send('loginInvalid\r\n err user');
        return false;
    }
    us.ws = ws;                 // 更新链接
    uo.ws = ws;
    ws.send('checkLoginOK\r\n');
    return true;
}

function getseckey(ws, req) {
    console.log('getseckey', req);
    // promise : key, value
    let p1 = new Promise((resolve,reject)=>{
        crypto.randomBytes(8, (err, buf) => {
            if (err) {
                console.log('randomBytes err:',err);
            }else{
                console.log(`${buf.length}bytes random str:${buf.toString('hex')}`);
                resolve(buf.toString('hex'));
            }
        });
    });
    let p2 = new Promise((resolve,reject)=>{
        crypto.randomBytes(8, (err, buf) => {
            if (err) {
                console.log('randomBytes err:',err);
            }else{
                console.log(`${buf.length}bytes random str:${buf.toString('hex')}`);
                resolve(buf.toString('hex'));
            }
        });
    });
    
    Promise.all([p1,p2]).then((data)=>{
        // cache.pushseckey(key, val);
        seckeys[data[0]] = data[1];
        // 可以用 ws 做 index console.log(ws.socket._handle.fd); 会变
        ws.send(`seckey\r\n${data[0]}\r\n${data[1]}`);
    });
}

function md5(src) {
    return crypto.createHash('md5').update(src,'utf8').digest('hex');
}
