'use strict';
console.log('模块加载时只执行一次？wx.js');
// 微信公众平台 Controller
const querystring = require('querystring'),
      urlencode = encodeURIComponent,
	  cache = require('../m/cache'),
      vxapi = require('../modules/vxapi'),
      ejsq = require('../modules/ejsq'),
      router = require('../modules/router'),
      NetC = require('../modules/netc').NetC,
	  xml2js = require('xml2js');

// 初始化
try{
    var netc = new NetC({host:global.tcpserver,port:9123});
    // netc.on('data',(data)=>{console.log(data);}); // 是否需要处理应答
}catch(e){
}
init_access_token();
// END 初始化

// 下面功能，移动到 vxapi，是通用的
exports.vxsign = vxsign;        // 验证jsdk签名
exports.uinfo = getuserinfo;  // 获取用户信息
exports.qrticket = qrticket;     // 创建参数二维码
exports.postHandle = postHandleBinary;

// 客户端ajax获取 jssdk signature
function vxsign(req, res, uri) {
	// get ticket	// sign	// response
	vxapi.getJsTicket((ticket)=>{
		let r = vxapi.sign(ticket, req.headers.referer);
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(r));
	});
}

//ajax获取用户unionid
function getuserinfo(req, res, uri) {
	vxapi.getUserInfo(uri.query.openid, (s)=>{
     	res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
		res.end(s);
	});
}

function qrticket(req, res, uri) {
    var sceneid = uri.query.sceneid,
        limit = (uri.query.limit===undefined?'0':uri.query.limit),
        token = uri.query.access_token;
    // console.log('qrticket',limit, sceneid, token);
    
	if (token === undefined || token==='') {
		vxapi.get_qr_ticket((tk)=> {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(urlencode(tk));
		}, limit, sceneid, global.access_token.token);
	}else{
		vxapi.get_qr_ticket((tk)=> {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.end(urlencode(tk));
		}, limit, sceneid, token);
	}
}

function postHandleBinary(req, res) {
	var chunks = [], size=0;
	req.on('data', function(chunk) {
		chunks.push(chunk);
        size += chunk.length;
        console.log('post chunk:', chunk.length);
	}).on('end', function() {
        console.log('post total:',chunks.length, size);
        var buffer = Buffer.concat(chunks, size);
		postHandle(req, res, buffer.toString('utf8'));
	});
}

function postHandle(req, res, data) {
	var xml = null, ret = {e:0, r:''};
	if (data.substr(0, 5) !== '<xml>') {
        console.log('tmp postHandle no xml', data);
		data = querystring.parse(data).text;
	}
	console.log(data);
    netc.send(JSON.stringify({c:'net',a:'wxkf',d:data}));

    // 处理微信数据，并回应
    xml2js.parseString(data, function(err,result){
        if(err === null ) {
			xml = result.xml;
            switch (xml.MsgType[0]) {
			case 'event':
                eventHandler(xml, ret);
				break;
			case 'text':
                textHandler(xml, ret);
				break;
			case 'image':
                imageHandler(xml, ret);
				break;
			case 'voice':// 语音
				break;
			default:
				// link，video 视频，shortvideo 小视频，location 位置
                // ret.r = replyMsg(xml, 'text.xml', 'text', [ data ]);
                break;
			}
        }else{
            console.log('wx.postHandle errmsg', err);
            ret.r = replyMsg(xml, 'text.xml', 'text', [ err ]);
        }
    });
    // 以上 handler 都是同步处理？？
	res.writeHead(200, {'Content-Type': 'text/xml'});
	res.end(ret.r);
}

function eventHandler(xml, ret) {
    switch(xml.Event[0]) {
    case 'subscribe':
        cache.del_user(xml.FromUserName[0]);
        subscribe(xml, ret);
        break;
    case 'unsubscribe':
        cache.del_user(xml.FromUserName[0]);
        unsubscribe(xml, ret);
        break;
    case 'scancode_waitmsg':    // 公众号里调用扫码1
        scan_vcode(xml, ret);
        break;
    case 'scancode_push':       // 公众号里调用扫码2
        break;
    case 'SCAN':                // 微信扫一扫
        scanEvent(xml, ret);
        break;
    case 'CLICK':
        clickEvent(xml, ret);
        break;
    case 'VIEW':
        viewEvent(xml, ret);
        break;
    case 'LOCATION':            // 地理位置上报
	    cache.xyset(xml.FromUserName[0],[xml.Latitude,xml.Longitude,xml.Precision]);
        break;
    default:
        // console.log('unknown event', xml.Event[0]);
        break;
    }
}

function textHandler(xml, ret) {
    var words = xml.Content[0].trim().toLowerCase(),
        openid = xml.FromUserName[0];
    
    // action 参数是各不相同的，怎么办？ 给全所有可能的参数?
    // router.xcall(controller, action, [args, params]);
    
    if(words==='dkf') {
        var dh = new Date().getHours();
        // if(dh>=18 || dh<9) {
        if(dh>11 || dh<9) {
            ret.r = replyMsg(xml, 'text.xml', 'text', ['bzcfg.kfoff']);
        }else{
		    ret.r = replyMsg(xml, 'dkf.xml', 'dkf'); // 告诉微信转多客服系统
        }
    }else{
        ret.r = replyMsg(xml, 'text.xml', 'text', [global.bzcfg.welcome]);
    }
}

function imageHandler(xml, ret) {
    var openid = xml.FromUserName[0];
}

function subscribe(xml, ret) {
	var qr = xml.EventKey[0],
        qrVal=qr.substr(8),
        openid = xml.FromUserName[0];
	console.log('newuser:', openid, xml.CreateTime[0], qr);
    
}

function unsubscribe(xml, ret) {
	console.log('unsubscribe:', xml.FromUserName[0], xml.CreateTime[0]);
}

function scan_vcode(xml, ret) {
    var openid = xml.FromUserName[0],
		qrinfo = xml.ScanCodeInfo[0],
		qrs = qrinfo.ScanResult[0];

    // japi.scanqr(xml.FromUserName[0], qrs);
    console.log('scan_vcode:', qrs);
}

function scanEvent(xml, ret) {  // 已关注用户, 微信扫一扫
	var qr = xml.EventKey[0];
    console.log('scanEvent', qr);
    // router.xcall(c,a, params); 参数是各不相同的，怎么办？ 给全所有可能的参数
}

function clickEvent(xml, ret) {
    let key = xml.EventKey[0],
        openid = xml.FromUserName[0];
    console.log('clickEvent', openid, key);
	switch (key) {
	case 'dkf':
		// ret.r = replyMsg(xml, 'dkf.xml', 'dkf');
		break;
	default:
        break;
	}
}

function viewEvent(xml, ret) {  // 可做日志
    console.log('viewEvent', xml.FromUserName[0], xml.EventKey[0]);
}

function replyMsg(xml, template, type, ar) {
	var data = {
		toUser: xml.FromUserName[0],
		fromUser: xml.ToUserName[0],
		time: xml.CreateTime[0]
	};
	if (type === 'text') {
		data.content = ar[0];
	} else if (type === 'music') {
		data.title = ar[0];
		data.desc = ar[1];
		data.music = ar[2];
		data.hqmusic = ar[2];
	} else if (type === 'news') {
		data.count = ar[0];
		data.items = [];
		for (var i = 0; i < ar[0]; ++i) {
			data.items.push(ar[i + 1]);
		}
	}
	if (type === 'image') {
		data.meda_id = ar;
	}
	return ejsq.renderxml(template, data);
}

function init_access_token() {
	vxapi.get_access_token((tk)=>{
        netc.send(JSON.stringify({c:'net',a:'wxtoken',ghid:global.ghid,tk:tk}));
    });
    setInterval(function() {
        vxapi.get_access_token((tk)=>{
            netc.send(JSON.stringify({c:'net',a:'wxtoken',ghid:global.ghid,tk:tk}));
        });
    }, 180000); // 三分钟    
}
