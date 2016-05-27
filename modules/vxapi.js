'use strict';
console.log(`模块只加载一次？vxapi.js:${module.id}, ${global.fsroot}`);

const japi = require(`${global.fsroot}/m/japi`), // 业务逻辑 后台接口
      cache = require(`${global.fsroot}/m/cache`); // 缓存

const https = require('https'),
      url = require('url'),
      urlencode = encodeURIComponent,
      ejsq = require('./ejsq'),
      util = require('./util'),
      crypto = require('crypto'),
      xml2js = require('xml2js'),
      fs = require('fs');

var getAccessToken = getAccessTokenWX;
// getAccessToken = global.getAccessToken; // m/japi.js
exports.get_access_token = (cb,force)=>{
	if (force===undefined && Date.now() < global.access_token.time) {
        var ds = new Date();
        ds.setTime(global.access_token.time);
		console.log('vxapi get_access_token', global.access_token, ds.toString());
		if(!!cb) { cb(global.access_token.token); }
		return;
	}
    getAccessToken(cb, force);
};

var wxtokens = {};
exports.setghtoken = (ghid, tk)=>{
    console.log('setghtoken: ',ghid,tk);
    wxtokens[ghid] = tk;
};

exports.shakeinfo = shakeinfo;
exports.uploadimg = uploadimg;
exports.decodecc = decode_card_code;

exports.wx_openid_handler = wx_openid_handler;
exports.get_wx_openid = getVXUserID;
exports.get_qr_ticket = getQrTicket; // 参数二维码的 ticket

exports.send48txtmsg = send48txtmsg;
exports.send48news = send48news;
exports.sendTplMsg = sendTemplateMsg;
exports.send48voice = send48voice;
exports.send48image = send48image;
exports.send48message = sendCustom48message;

exports.create_wx_menu = create_wx_menu;
exports.getUserInfo = getUserInfo;
exports.search_user_agent = search_user_agent;
exports.materialist = materialist;


exports.checkSignature = (signature, timestamp, nonce)=> {
	var sar = [global.mptoken, timestamp, nonce].sort(),
	    ss = util.sha1(sar.join(''));
	if (signature === ss) {
		return true;
	} else {
		console.log(`checkSignature failed ${signature} !== ${ss}, token:${global.mptoken} appid:${global.APPID}`);
		return false;
	}
};

exports.getkflist = (cb) => {
    let api = `https://api.weixin.qq.com/cgi-bin/customservice/getkflist?access_token=${global.access_token.token}`;
    getvxapi(api, cb);
};

exports.getkfsession = (kf, cb) => {
    const api = `https://api.weixin.qq.com/cgi-bin/customservice/getkflist?access_token=${global.access_token.token}`;
    getvxapi(api, (ret)=>{
        try{
            const jo = JSON.parse(ret);
            var lst = jo.kf_list,
                len = lst.length;
        }catch(e){
            cb();
            return;
        }
        if(len>0) {
            let kflst = [];
            for(let i=0;i<len;++i) {
                kflst.push(lst[i].kf_account);
            }
            // console.log(kflst);
            if(kflst.indexOf(kf) !== -1) {
                const api2 = `https://api.weixin.qq.com/customservice/kfsession/getsessionlist?access_token=${global.access_token.token}&kf_account=${kf}`;
                getvxapi(api2, cb);
            }else{
                console.log('非法客服：',kf);
                cb();
            }
        }else{
            cb();
        }
    });    
};

exports.closekfs = (kf, user)=> {
    // 2016-04-18 15:09:49 新版客服，关闭客服会话
    var api2 = '/customservice/kfsession/close?access_token='+global.access_token.token,
        param={
            kf_account: kf,
            openid :user
        };
    callvxapi(api2, param, function(result){
        console.log('closekfsession:',result);
    });
};

exports.getkfrecord = (th, cb)=> {
    // 2016-04-18 15:06:31 新版多客服，查询客服记录
    var api1 = `/customservice/msgrecord/getrecord?access_token=${global.access_token.token}`,
        etime = Date.now(),stime = etime - 24*60*60*1000,
        data = {
            "starttime":parseInt(stime/1000),
            "endtime" : parseInt(etime/1000),
            "pageindex" : 1,
            "pagesize" : 50
        },param={};
    callvxapi(api1, data, function(ret){
        var jo = JSON.parse(ret),
            lst=jo.recordlist,
            l =lst.length,
            o, users=[];
        if(cb!==undefined) cb(lst);
        for(var i=0;i<l;++i) {
            o = lst[i];
            console.log(o);
        }
    });
};

function materialist(type, offset, count, token, cb) {
    var api = '/cgi-bin/material/batchget_material?access_token=' + token,
        data = {
            "type":type,
            "offset":offset,
            "count":count
        };
    console.log('materialist', data);
    callvxapi(api, data, function(d) {
        cb(d);
    });
}

exports.cashtransfer = (openid, cash, desc, callback)=>{
    // 微信企业付款
    var reqdat = {},
        tpl = 'cash2.xml';
    transferargs(reqdat);
    
    // 交易号 mchid + yyyymmdd + 10位一天内不能重复的数字
    var d = new Date(),
        da = d.toISOString().split('T'),
        ds = da[0].replace(/-/g,''),
        dn = da[1].replace(/[:.]/g,'');
    dn = dn.replace('Z', Math.random().toString().substr(2,1));
    reqdat.tradeno = [global.mch_id, ds, dn].join('');
    reqdat.openid = openid;
    reqdat.amount = cash;
    reqdat.desc = desc;

    // 参数转为微信所需的 xml
    var stmp = ejsq.renderxml(tpl, reqdat), xml=null;
    console.log('cashtransfer xmlstr tmp', stmp);

    xml2js.parseString(stmp, function(err, result){
        // console.log('cashtransfer debug xml', result);
        if(err === null ) {
			xml = result.xml;
            reqdat.sign = hbmksign(xml);        // 计算签名
            stmp = ejsq.renderxml(tpl, reqdat); // 重新生成数据
            console.log('cashtransfer xmlstr', stmp);

            var key = global.fsroot+'/apiclient_key.pem',
                // caf = 'vjf/rootca.pem',
                cert = global.fsroot+'/apiclient_cert.pem';

            // console.log('ca path:',key, cert);
            fs.exists(key, function (exists) {
                if(exists) {
                    callvsapi('/mmpaymkttransfers/promotion/transfers',stmp,callback,key,cert);
                }else{
                    console.log('cashtransfer errmsg 没有证书文件');
                }
            });
        }
    });
};

exports.sendvredbag = (openid, cash,min,max, num, wishing, sname, callback)=> {
    // 微信红包， cash 单位【分】
    var reqdat = {},
        tpl = 'cash.xml';
    hbparams(reqdat);             // 1 参数准备

    // mch_id + yyyymmdd + 10位一天内不能重复的数字
    var d = new Date(),
        da = d.toISOString().split('T'),
        ds = da[0].replace(/-/g,''),
        dn = da[1].replace(/[:.]/g,'');
    dn = dn.replace('Z', Math.random().toString().substr(2,1));

    reqdat.billno = [global.mch_id, ds, dn].join('');
    
    reqdat.openid = openid;     // 红包接收者
    reqdat.amount = cash;       // 付款金额
    reqdat.min = min;          // 最小红包金额
    reqdat.max = max;          // 最大红包金额
    reqdat.totalnum = num;     // 发放人数

    reqdat.wishing = wishing;  // 红包祝福语,打开红包和拆开红包页面都有
    reqdat.sendname = sname;   // 商户名称,红包发送者,红包消息、红包、拆开三处都有

    console.log('sendvredbag debug reqdat', reqdat);
    // 参数转为微信所需的 xml
    var stmp = ejsq.renderxml(tpl, reqdat), xml=null;
    console.log('sendvredbag xmlstr tmp', stmp);
    
    xml2js.parseString(stmp, function(err, result){
        // console.log('sendvredbag debug xml', result);
        if(err === null ) {
			xml = result.xml;
            reqdat.sign = hbmksign(xml);          // 计算签名
            stmp = ejsq.renderxml(tpl, reqdat); // 重新生成数据
            console.log('sendvredbag xmlstr', stmp);

            var key = global.fsroot+'/apiclient_key.pem',
                // caf = 'vjf/rootca.pem',
                cert = global.fsroot+'/apiclient_cert.pem';

            // console.log('ca path:',key, cert);
            fs.exists(key, function (exists) {
                if(exists) {
                    callvsapi('/mmpaymkttransfers/sendredpack',stmp,callback,key,cert);
                }else{
                    console.log('sendvredbag errmsg 没有证书文件');
                    // util.log('sendvredbag errmsg 没有证书文件');// 带时间
                }
            });
            
        }
        
    });
};

function decode_card_code(req, res, uri) {
    if(uri.query.ec===undefined) {
        res.end('no encrypt card code');
    }else{
        var api = '/card/code/decrypt?access_token=' + global.access_token.token,
            data = {
                "encrypt_code":uri.query.ec
            };
        callvxapi(api, data, function(d) {
            res.end(d);
        });
    }
}

function shakeinfo(ticket, callback) {
    if(illegalCC(ticket)) {
        console.log('vxapi.shakeinfo illegal ticket:', ticket);
        callback('non');
        return;
    }
    // https://api.weixin.qq.com/shakearound/device/update?access_token=ACCESS_TOKEN
    var api = '/shakearound/user/getshakeinfo?access_token=' + global.access_token.token,
        data = {
            "ticket":ticket,
            "need_poi": 1
        };

    console.log('shakeinfo', ticket);

    callvxapi(api, data, function(d) {
        console.log('shakeinfo ret %s', d);
        callback(d);
    });
}

function wx_openid_handler(uri, data, reurl, res, req, tpl) {
    // console.log('wx_openid_handler', Date.now(),reurl);
    if (uri.query.openid !== undefined) {
        if (uri.query.from === undefined) {
            ejsq.render(tpl, data, req, res);
        } else {
            // 从分享链接打开时，需要获得打开者的openid，并记录分享者id
            if (uri.query.sid === undefined) { // 变 openid 为 sopenid
                reurl += '&sid=' + uri.query.openid;
                if (reurl.indexOf('?') === -1) { // URL格式，第一个参数是?x=y
                    reurl = reurl.replace('&', '?');
                }
            }
            let oaurl = global.oauth_url + urlencode(reurl) + global.oauth_args_base;
            res.writeHead(302, {
                'Cache-Control': 'no-cache',
                'location': oaurl
            }); // can't cookie
            res.end();
        }
        return;
    }
    // else
    // console.log('wx_openid_handler else', tpl);
    if (uri.query.code === undefined) {
        //并且处理
        if (uri.query.getopenid === undefined && uri.query.getOpenid === undefined) {
            // 有 openid 或 不需要 openid
            ejsq.render(tpl, data, req, res);
        } else { // 会有 getopenid !== undefined 的情况吗？
            let oaurl = global.oauth_url + urlencode(reurl) + global.oauth_args_base;
            // ejsq.render('redirector.html', {reurl: oaurl}, req, res);// can cookie
            res.writeHead(302, {
                'Cache-Control': 'no-cache',
                'location': oaurl
            }); // can't cookie
            res.end();
        }
    } else {
        // uri.query.code 合法性判断？
        getVXUserID(req, res, uri, reurl); // 注意参数别写错
    }
}

function illegalCC(code) {
    // const re = /[":% '<>&();\+\-{}\[\]]/;
    const re = /[":% '<>&();{}\[\]]/;
    return re.test(code);
}

// 服务器端阻塞全部用户，客户端只阻塞个人用户
function getVXUserID(req, res, uri, redirect_url) {

    if(illegalCC(uri.query.code)) {
        console.log('getVXUserID illegal code:', uri.query.code);
        res.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
        res.write('<h1>' + global.cfg.tips.VVXNetError + '</h1>');
        res.end();
        return;
    }

    // 获取 openid
    let appid = global.APPID, appsec=global.APPSEC,
        options = {
        hostname: 'api.weixin.qq.com',
        port: 443,
        path: '/sns/oauth2/access_token?appid=' + appid + '&secret=' + appsec + '&code=' + uri.query.code + '&grant_type=authorization_code',
        method: 'GET'
    };
    var reqa = https.request(options, function(resc) {
        var s = '';
        resc.on('data', function(d) {
            s += d;
        });
        resc.on('end', function() {
            try {
                if (resc.statusCode === 200) {
                    var o = JSON.parse(s),
                        uri = url.parse(redirect_url, true);
                    if (uri.search.length === 0) {
                        redirect_url += '?openid=' + o.openid;
                    } else {
                        redirect_url += '&openid=' + o.openid;
                    }
                    res.writeHead(301, {
                        'Cache-Control': 'no-cache',
                        'location': redirect_url
                    });
                    res.end();
                } else {
                    res.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
                    res.write('<h1>' + global.cfg.tips.VVXNetError + '</h1>');
                    res.end();
                }
            } catch (e) {
                res.writeHead(404, {'Content-Type': 'text/html;charset=utf-8'});
                res.write('<h1>' + global.cfg.tips.VVXCatchError + '</h1>');
                res.end();
                console.log('getVXUserID error:', e, s);
            }
        });
    });
    reqa.end();
    reqa.on('error', function(e) {
        console.error(e);
    });
}
function sendTemplateMsg(msg, cb) {
    var datab;
    if (typeof msg === 'string') {
        datab = new Buffer(msg);
    } else {
        datab = new Buffer(JSON.stringify(msg));
    }

    var opts = {
        hostname: 'api.weixin.qq.com',
        port: 443,
        path: '/cgi-bin/message/template/send?access_token=' + global.access_token.token,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': datab.length
        }
    };

    var preq = https.request(opts, function(res) {
        var s = '';
        res.on('data', function(d) {
            s += d;
        });
        res.on('end', function() {
            console.log('sendTemplateMsg:', s);
            if (cb !== undefined) {
                cb(s);
            }
        });
    });
    preq.write(datab);
    preq.end();
    preq.on('error', function(e) {
        console.log('sendTemplateMsg err:', e, msg);
    });
}

function sendCustom48message(msg, token) {
    // console.log('send48message:', msg.touser,msg.msgtype);
    if (typeof msg !== 'string') {
        msg = JSON.stringify(msg);
    }
    var datab = new Buffer(msg),
        opts = {
        hostname: 'api.weixin.qq.com',
        port: 443,
        path: '/cgi-bin/message/custom/send?access_token=' + token,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': datab.length
        }
    };

    var preq = https.request(opts, function(res) {
        var s = '',
            jo;
        res.on('data', function(d) {
            s += d;
        });
        res.on('end', function() {
            try {
                jo = JSON.parse(s);
                if (jo.errcode !== 0) { // 有错误发生
                    console.log('send48messageErr', s, msg);
                    if([40001,40014,41001,42001].indexOf(jo.errcode)!==-1){
                        // access_token 问题 强制接口刷新token
                        getAccessToken(false,'compulsoryGetToken');
                    }
                } else {
                    console.log('send48messageOK', msg);
                }
            } catch (e) {
                console.log('send48messageE2', s, msg);
            }
        });
    });
    preq.write(datab);
    preq.end();
    preq.on('error', function(e) {
        console.log('send48messageE:', e, msg);
    });

}

function getUserInfo(openid, callback, ghid) {
    if (openid === undefined || openid === null || openid === '' || openid === 'undefined' || openid === 'null') {
        console.log('getUserInfo errmsg: invalid openid[%s]', openid);
        callback('{}');
        return;
    }
    
    if(illegalCC(openid)) {
        console.log('getUserBasicInfo illegal openid:', openid);
        callback(`非法参数 ${openid}`);
        return;
    }

    cache.get_user(openid, function(e,d) {
        if (d ) {
            console.log(`getUserInfo from cache:${d}`); // 字符串模板自动 buf2str
            callback(d);
        } else {
            getUserBasicInfo(openid, callback, ghid);
        }
    });
}

function getUserBasicInfo(openid, callback, ghid) {
    // 改进点：
    // 1 可缓存 gh__openid => uinfo
    // 2 如果 openid : undefined, null, '' 直接返回失败
    // 3 更新 access_token 不是每次调用，而定时更新。还是有问题？
    //   公众平台会保证在access_token刷新后，旧的access_token在5分钟内仍能使用，以确保第三方在更新access_token时不会发生第三方调用微信api的失败。
    // 一旦发现 access_token 失效，立刻触发事件 'update_vxak'?
    
    var tk = '';
    if(ghid===undefined) {
        if(global.access_token!==undefined) {
            tk = global.access_token.token;
        }
    }else{
        tk = wxtokens[ghid];
    }
    if(tk.length===0 || tk === undefined) {
        console.log('getUserBasicInfo no token', wxtokens, ghid);
        return;
    }

    var options = {
        port: 443,
        hostname: 'api.weixin.qq.com',
        path: '/cgi-bin/user/info?access_token=' + tk + '&openid=' + openid + '&lang=zh_CN',
        method: 'GET'
    };
    var ireq = https.request(options, function(ires) {
        var s = '';
        ires.on('data', function(d) {
            s += d;
        });
        ires.on('end', function() {
            console.log('getUserBasicInfo:', s, openid);
            //判断传来的如果不是字符串的时候的异常处理
            try {
                if (ires.statusCode === 200) {
                    s = util.utf8clean(s);
                    var o = JSON.parse(s);
                    if (o.errcode !== undefined) {
                        console.log('getUserBasicInfo errmsg', s);
                    } else {
                        cache.set_user(openid, s, 5 * 24 * 3600); // 5天
                        // cache.mcset(global.h5server+openid, s, 30); // 自测 30 秒
                    }
                    callback(s);
                } else {
                    console.log('getUserBasicInfo error1', ires.statusCode);
                    callback(`error1 ${ires.statusCode}`);
                }
            } catch (e) {
                console.log('getUserBasicInfo error2', e, s);
                callback(`error2 ${e}`);
            }
        });
    });
    ireq.on('error', function(e) {
        console.error('getUserBasicInfo error3', e);
    });
    ireq.end();
}


function getAccessTokenWX(callf, force) {
    var d = new Date(),
        dt = d.getTime(),
        ds = d.toString();
    console.log(`从微信获取access_token ${ds}`);

    let api = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${global.APPID}&secret=${global.APPSEC}`;
    getvxapi(api, (ret)=>{
        try {
            var o = JSON.parse(ret);
        } catch (e) {
            console.log('getAccessTokenWX error:', e, ret);
            return;
        }
        global.access_token.time = o.expires_in * 1000 + dt;
        global.access_token.token = o.access_token;
        console.log(`getAccessTokenWX:${global.access_token.token} of ${global.APPID}`);
        if(callf!==undefined) callf(o.access_token);
    });
}

function send48txtmsg(uid, msg, ghid) {
    var txtmsg = {
        "touser": uid,
        "msgtype": 'text',
        "text": {
            "content": msg
        }
    },tk='';

    if(ghid===undefined) {
        if(global.access_token!==undefined) {
            tk = global.access_token.token;
        }
    }else{
        tk = wxtokens[ghid];
    }
    
    console.log('send48txtmsg:%s\n%s\n%s\n%s\n%j',uid,msg, ghid, tk, wxtokens);
    if(tk.length===0 || tk === undefined) {
        console.log('send48txtmsg no token', wxtokens, ghid);
        return;
    }
    sendCustom48message(txtmsg, tk);
}

function send48voice(uid, media_id) {
    var msg = {
        "touser": uid,
        "msgtype": "voice",
        "voice": {
            "media_id": media_id
        }
    };
    sendCustom48message(msg, global.access_token.token);
}

function send48image(uid, media_id) {
    var msg = {
        "touser": uid,
        "msgtype": "image",
        "image": {
            "media_id": media_id
        }
    };
    sendCustom48message(msg, global.access_token.token);
}

// openid 发送给谁
// msg = [{
//  title: title, 图文块的标题
//  description: des,图文块的文字信息
//  picurl: pic, 图文块中的图片
//  url: url 点击图文块打开的页面URL
// },...]
// curl -F media=@test.jpg "https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN"

function uploadimg(req, res) {
    // http post 请求传递下去
    // fileSize = parseInt(req.headers['content-length']), // size 包括 formdata 头和尾
    var opts = {
            hostname: 'api.weixin.qq.com',
            port: 443,
            path: '/cgi-bin/media/uploadimg?access_token='+global.access_token.token,
            method: 'POST'
        };
    opts.headers = req.headers;
    // console.log(opts.headers);
    delete opts.headers.host;
    delete opts.headers.cookie;
    
    var ireq = https.request(opts, function(ires) {
        var s = '';
        ires.on('data', function(d) {
            s += d;
        });
        ires.on('end', function() {
            console.log('vxapi_ret：', s);
            res.writeHead(200);
            res.end(s);
        });
    });
    ireq.on('error', function(e) {
        console.error('vxapi_err', e);
    });

    req.pipe(ireq);
    // ireq.write(databuf);
    // ireq.end();
}

function send48news(openid, msg) { // 图文消息
    if (typeof msg === 'string') {
        try {
            msg = JSON.parse(msg);
        } catch (e) {
            console.log('send48news errmsg:', msg, e);
        }
    }

    var jnews = {
        "touser": openid,
        "msgtype": "news",
        "news": {
            "articles": msg
        }
    };
    sendCustom48message(jnews, global.access_token.token);
}

function create_wx_menu(menu, token) {
    var api = '/cgi-bin/menu/create?access_token=' + global.access_token.token;
    callvxapi(api, menu, function(s) {
        console.log('程序重启,菜单创建:', s);
    });
}


/**
 * @synopsis 签名算法
 *
 * @param jsapi_ticket 用于签名的 jsapi_ticket
 * @param url 用于签名的 url ，注意必须与调用 JSAPI 时的页面 URL 完全一致
 *
 * @returns
 */
exports.sign = function(jsapi_ticket, url) {
    var ret = {
        jsapi_ticket: jsapi_ticket,
        nonceStr: createNonceStr(),
        timestamp: createTimestamp(),
        url: url
    };

    var str = raw(ret);
    ret.jsapi_ticket = '';
    ret.appId = global.APPID;
    ret.signature = util.sha1(str);

    return ret;
};

exports.getJsTicket = function(callf) {
    // 成功返回如下JSON：
    // {
    //  "errcode":0,
    //  "errmsg":"ok",
    //  "ticket":"bxLdikRXVbTPdHSM05e5u5sUoXNKd8-41ZO3MhKoyN5OfkWITDGgnr2fwJ0m9E8NYzWKVZvdVtaUgWvsdshFKA",
    //  "expires_in":7200
    // }
    // 全局缓存,有效期7200秒, 先取缓存, 若超时了则重新获取

    cache.get_ticket(function(d) {
        // console.log('get_ticket:', d);
        if (!d ) {
            d = "0,0";
        }
        var i = d.indexOf(','),
            old = parseInt(d.substr(0, i), 10),
            now = parseInt(Date.now() / 1000, 10),
            ticket = d.substr(i + 1);

        if (old !== 0 && now - old < 7000 && ticket.trim().length > 30) {
            console.log('getJsTicket from cache',now,old);
            callf(ticket);
        } else {
            var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + global.access_token.token + '&type=jsapi';
            https.get(url, function(res) {
                var s = '';
                res.on('data', function(d) {
                    s += d;
                });
                res.on('end', function() {
                    try {
                        // console.log('getJsTicket', s);
                        var o = JSON.parse(s);
                        if (o.errcode === 0) {
                            cache.set_ticket([now, o.ticket].join(','));
                            callf(o.ticket);
                        } else {
                            console.log('getJsTicket errmsg', s);
                        }
                    } catch (e) {
                        console.log('getJsTicket errmsg:', e, s);
                    }
                });
            });
        }
    });
};

exports.updateJsTicket = function(tk) {
    // 全局缓存,有效期7200秒, 先取缓存, 若超时了则重新获取
    cache.get_ticket(function(d) {
        console.log('updateJsTicket old ticket',d);
    });
    var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + tk + '&type=jsapi';
    https.get(url, function(res) {
        var s = '';
        res.on('data', function(d) {
            s += d;
        });
        res.on('end', function() {
            try {
                console.log('updateJsTicket', s);
                var o = JSON.parse(s);
                if (o.errcode === 0) {
                    var now = parseInt(Date.now() / 1000, 10);
                    cache.set_ticket([now, o.ticket].join(','));
                } else {
                    console.log('getJsTicket errmsg', s);
                }
            } catch (e) {
                console.log('getJsTicket errmsg:', e, s);
            }
        });
    });
    cache.get_ticket(function(d) {
        console.log('updateJsTicket new ticket',d);
    });
};

var raw = function(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function(key) {
        newArgs[key.toLowerCase()] = args[key];
    });

    var str = '';
    for (var k in newArgs) {
        str += '&' + k + '=' + newArgs[k];
    }
    str = str.substr(1);
    return str;
};

// begin weixin js-sdk sign
var createNonceStr = function() {
    return Math.random().toString(36).substr(2, 15);
};
var createTimestamp = function() {
    return parseInt(Date.now() / 1000) + '';
};

// 二维码, 临时二维码32bit unsigned int : 4294967295
function getQrTicket(callf, limit, sid, token) {
    var data = {
        "action_name": "QR_LIMIT_SCENE",
        "action_info": {
            "scene": {
                "scene_id": sid
            }
        }
    };

    if (limit !== '0') {
        data.action_name = "QR_SCENE"; // 临时二维码
        data.expire_seconds = limit;
    }

    console.log('getQrTicket', data);
    var api = '/cgi-bin/qrcode/create?access_token=' + token;

    callvxapi(api, data, function(d) {
        try {
            // console.log('getQrTicket %s', s);
            var o = JSON.parse(d);
            callf(o.ticket);
        } catch (e) {
            console.log('getQrTicket error:', e, d);
        }
    });
}

//增加一个判断浏览器头部代理的函数
function search_user_agent(req, iswx) {
    var ua = req.headers['user-agent'] || '',
        platform = 100;
    if (iswx) {
        if (ua.indexOf(iswx) === -1) {
            platform = true;
        } else {
            platform = false; //来自微信的时候
        }
    } else {
        if (ua.match(/android/i)) {
            platform = 200;
        } else if (ua.match(/iphone/i)) {
            platform = 100;
        } else {
            platform = 1000; //其他的情况返回为1000
        }
    }
    return platform;
}

function getvxapi(api, callback) {
    let req = https.get(api, (res)=>{
        var bufs = [], size=0;
        res.on('data', function(d) {
            bufs.push(d);
            size += d.length;
        });
        res.on('end', function() {
            let buf = Buffer.concat(bufs, size);
            callback(buf.toString('utf8'));
        });
    });
    req.on('error', (e)=>{
        console.error(`getvxapi ${api}\n ${e}`);
    });
}

function callvsapi(api, req, callback, key, cert) {
	var databuf = new Buffer(req);
	var opts = {
		hostname: 'api.mch.weixin.qq.com',
		port: 443,
		path: api,
		method: 'POST',
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert),
		headers: {
			// 'Content-Type': 'application/json',
			'Content-Type': 'text/xml',
			'Content-Length': databuf.length
		}
	};
	var preq = https.request(opts, function(res) {
		var s = '';
		res.on('data', function(d) {
			s += d;
		});
		res.on('end', function() {
			// console.log('callvsapi：', s);
			if (callback !== undefined) {
				callback(s);
			}
		});
	});
	preq.on('error', function(e) {
		console.error('callvsapi_err', e, api);
	});
	preq.write(databuf);
	preq.end();
}


function callvxapi(api, req, callback) {
    // console.log('callvxapi:', api, JSON.stringify(req));
    var reqs = JSON.stringify(req),
        databuf = new Buffer(reqs),
        opts = {
            hostname: 'api.weixin.qq.com',
            port: 443,
            path: api,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': databuf.length
            }
        };
    var preq = https.request(opts, function(res) {
        var s = '';
        res.on('data', function(d) {
            s += d;
        });
        res.on('end', function() {
            // console.log('vxapi_ret：', s, api);
            if (callback !== undefined) {
                callback(s);
            }
        });
    });
    preq.on('error', function(e) {
        console.error('callvxapi_err', e, api, reqs);
    });
    preq.write(databuf);
    preq.end();
}

function hbmksign(xml) {
    var k='',v='',keys=[],args=[];

    for(k in xml) {
        v = xml[k][0];
        if(v !== undefined && v !=='') {
            keys.push(k);
        }
    }
    // console.log('keys',keys);
    keys.sort();
    // console.log('keys',keys);

    for(var i in keys) {
        k = keys[i];
        v = xml[k][0];
        args.push(k + '=' + v);
    }
    
    v = args.join('&');
    console.log('stringA', v, global.cashapikey);

    var md5 = crypto.createHash('md5');
    md5.update(v,'utf-8');
    md5.update('&key='+global.cashapikey, 'utf-8');
    return md5.digest('hex').toUpperCase();
}

function hbparams(data) {
    data.nonce = Math.random()+'';
    data.mchid = global.mch_id;
    data.appid = global.APPID;
    data.nickname = 'V积分品牌合作'; // 红包提供方名称, 界面没出现
    data.sendname = 'V积分';          // 商户名称，红包发送者
    data.openid = '';                 // 红包接收者
    data.amount = 1;                  // 付款金额
    data.min = 1;                     // 最小红包金额
    data.max = 1;                     // 最大红包金额
    data.totalnum = 1;                // 红包发放人数
    data.wishing = '红包祝福语';
    data.csip = global.ip;      // 调用接口的机器Ip地址
    data.actname = '活动名称';  // 界面没出现
    data.actid = 0;             // 活动id，开发文档中没有说明
    data.remark = '【备注：来自V积分】';
    data.logo = 'http://'+global.h5server+'/static/img/vlogo.jpg';
    data.share = '';            // 开发文档中没有说明
    data.url = '';
    data.img = '';
    data.sign = '';
}

function transferargs(data) {
    data.appid = global.APPID;
    data.mchid = global.mch_id;
    data.nonce = Math.random()+'';
    data.tradeno = '';           // 交易号
    data.openid = '';            // 红包接收者
    data.checkname = 'NO_CHECK'; // 不校验真实姓名
    data.amount = 1;             // 付款金额
    data.desc = '付款说明';
    data.csip = global.ip;      // 调用接口的机器Ip地址
    data.sign = '';
}
