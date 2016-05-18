'use strict';
console.log('模块加载只执行一次？ 业务逻辑模块 后端接口封装 japi.js');
var https = require('https'),
	http = require('http');

exports.getAccessToken = getAccessToken;
global.getAccessToken = getAccessToken; // 解决相互引用问题 vxapi.js

var vxapi = require('../modules/vxapi'),
    ejsq = require('../modules/ejsq'),
    router = require('../modules/router'),
	xml2js = require('xml2js'),
	cache = require('./cache');

// var bzcfg = global.bzcfg; 这样不行. 配置修改后，本地变量没有变化！？

exports.scanqr = function(openid, qrstr) {
	var req = {
		"requestTime": Date.now(),
		"commandType": "scanQrcodePrizes",
		"protocol": "1.0.0",
		"commandInfo": {
			"srvuserkey": '',
			"srvuseropenid": openid,
			"applicationtype": 3,
			"param": qrstr
		}
	};
    var api = '/offlineExchange/index.do';
    calljapi2(api, req, (s)=>{
        scanqr_biz(s, openid, qrstr);
    });
};

function scanqr_biz(s, openid, qrstr) {
	try {
		var o = JSON.parse(s);
	} catch (e) {
		console.log('扫兑换码 err', e);
		vxapi.send48txtmsg(openid, '扫码错误E：' + s);
        return;
	}
        
	if (o.result.code === '0' && o.result.businessCode === '0') {
		var dat = o.reply.obj;
		var qra = qrstr.split(',');
		var urlparams = ['opkey=', dat.srvuserkey, '&apptype=3', '&user=', qra[3], '&store=', dat.storekey, '&award=', dat.awardskey, '&pkg=', dat.presentkey, '&rule=', dat.rulekey, '&opid=', openid].join('');
		console.log('urlparams:', urlparams);
		var awardsname = o.reply.obj.awardsname.replace('<br/>','\n');
		vxapi.send48txtmsg(
			openid, ['扫码成功，可以兑换“', awardsname, '”<a href="http://', global.h5server, '/v/x/prize_scan/prize_scan.html?', urlparams, '">点击这里确认兑换</a>'].join(''));
	} else {
		var msg = '';
		if (o.result.code !== '0') {
			msg = '服务器错误，稍后再试';
		} else {
			switch (o.result.businessCode) {
			case '1':
				msg = '不是兑换码';
				break;
			case '2':
				msg = '红包已过期';
				break;
			case '3':
				msg = '红包已兑换';
				break;
			case '4':
				msg = '红包已转送';
				break;
			case '5':
				msg = '该红包无法在该兑换点兑换';
				break;
			case '6':
				msg = '<a href="http://'+ global.h5server + '/prize/bind?openid=' + openid + '">☞请先【绑定兑换点】</a>';
				break;
			default:
				msg = 'businessCode:' + o.result.businessCode;
				break;
			}
		}
		vxapi.send48txtmsg(openid, msg);
	}
}

// compulsoryGetToken
function getAccessToken(callback, force) {
	console.log('java getAccessToken1');
    const req = {
		"requestTime": Date.now(),
		"commandType": force === undefined ? 'getAccessToken' : 'compulsoryGetToken',
		"protocol": "1.0.0",
		"commandInfo": {
			"appid": global.APPID,
			"appsec": global.APPSEC
		}
	}, api='/accessToken/index.do';
    calljapi(api, req, (s)=>{
	    console.log(`jiekou getAccessToken:${s}`);
		try {
			var o = JSON.parse(s);
			if (o.result.code == 0 && o.result.businessCode == 0) {
				global.access_token.time = o.reply.expiretime;
				global.access_token.token = o.reply.accesstoken;
		        if(!!callback) { callback(global.access_token.token); }
			} else {
				console.log('java getAccessToken err:%s', s);
			}
		} catch (e) {
			console.log('getAccessToken', s, 'err', e);
		}
    });
}

function htmltext(res, msg) {
	res.writeHead(200, {'Content-Type':'text/html;charset=UTF-8'});
    res.write('<meta name="viewport" content="width=device-width,initial-scale=1"/>');
    res.end('<h3>'+msg+'</h3>');
}

function gender(sex) {
	return sex == 2 ? 0 : sex == 0 ? '' : sex;
}

function calljapi2(api, req, callback) {
	console.log('calljapi2:', api);
    var reqs = JSON.stringify(req),
        databuf = new Buffer(reqs),
        opts = {
		    hostname: global.japi2,
		    port: global.jport2,
		    path: global.jpath2 + api,
		    method: 'POST',
		    headers: {
			    'Content-Type': 'application/json',
			    'Content-Length': databuf.length
		    }
	    };

	var preq = http.request(opts, function(res) {
		var s = '';
		res.on('data', function(d) {
			s += d;
		});
		res.on('end', function() {
			console.log('japi2_ret：', s, opts,reqs);
			if (callback !== undefined) {
				callback(s);
			}
		});
	});
	preq.on('error', function(e) {
		console.error('calljapi2_err', e, opts,reqs);
	});

	preq.write(databuf);
	preq.end();
}

function calljapi(api, req, callback) {
	console.log('calljapi:', api);
    var reqs = JSON.stringify(req),
	    databuf = new Buffer(reqs),
	    opts = {
		    hostname: global.japi,
		    port: global.jport,
		    path: global.jpath + api,
		    method: 'POST',
		    headers: {
			    'Content-Type': 'application/json',
			    'Content-Length': databuf.length
		    }
	    };

	// var preq = https.request(opts, function(res) {
	var preq = http.request(opts, function(res) {
		var s = '';
		res.on('data', function(d) {
			s += d;
		});
		res.on('end', function() {
			console.log('japi_ret：', s, opts, reqs);
			if (callback !== undefined) {
				callback(s);
			}
		});
	});
	preq.on('error', function(e) {
		console.error('calljapi_err', e, opts, reqs);
	});

	preq.write(databuf);
	preq.end();
}
