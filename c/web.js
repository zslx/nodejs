'use strict';
console.log('模块加载时只执行一次？web');
// web Controller
const querystring = require('querystring'),
      vxapi = require('../modules/vxapi'),
      wx = require('./wx'),
      ejsq = require('../modules/ejsq');

// test case
// 1 utf8: response.writeHead, res.write, res.end
// 2 index signature, normal
// 3 phome signature, normal

exports.phome=post_index;
exports.my = (req, res, uri)=> {
    let tpl='web/home.html',
        data={};
    // 没有登录则跳转到 login
    ejsq.render(tpl, data, req, res);
};

exports.bbs = (req, res, uri)=> {
    let tpl='web/tieba.html',
        data={};
    // 查找与创建合一， 有则显示在下面，没有则显示创建
    ejsq.render(tpl, data, req, res);
};

exports.login = (req, res, uri)=> {
    let tpl='web/login.html',
        data={};
    // 三种方式， 邮件和密码， 手机和验证码， 微信扫码
    // 登录与注册合一
    ejsq.render(tpl, data, req, res);
};

exports.index = (req, res, uri)=> { // get root, index action
    let q = uri.query;
	if(q.signature!==undefined && q.timestamp!==undefined && q.nonce!==undefined) {
        console.log('get wx signature'); // 配置公众号时调用
     	res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
		if(vxapi.checkSignature(q.signature, q.timestamp, q.nonce)) { // 验证签名
	        res.end(q.echostr);
        }else{
	        res.end('checkSignature failed.签名验证错误。');
        }
        return;
    }
    let tpl='welcome.html',
        data={};
    ejsq.render(tpl, data, req, res);
};

function post_index(req, res, uri) { // post root
    let q = uri.query;
	if(q.signature!==undefined && q.timestamp!==undefined && q.nonce!==undefined) {
        // 微信服务器推送的数据
		if(vxapi.checkSignature(q.signature, q.timestamp, q.nonce)) { // 验证签名
            wx.postHandle(req, res);
        }else{
     		res.writeHead(200, {'Content-Type': 'text/plain;charset=utf-8'});
			console.error('非法的微信数据');
			res.end('非法的微信数据');
        }
        return;
    }
    
    var bufs = [], size=0;
	req.on('data',function(chunk){
	    bufs.push(chunk);
        size += chunk.length;
	}).on('end', function() {
        let buf = Buffer.concat(bufs, size);
        
        // let postData = buf.toString('utf8');
		// var fields = querystring.parse(postData);
        
        console.log('web.phome:', bufs.length, size);
        
     	res.writeHead(200, {'Content-Type': 'text/html'});
		// res.end(decodeURIComponent(postData));
        
        res.write(buf, 'utf8');
		res.end();
	});
}
