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
exports.home = (req, res, uri)=> {
    let tpl='web/home.html',
        data={};
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
