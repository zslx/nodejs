'use strict';
console.log('模块加载时只执行一次？web');
// web Controller
const querystring = require('querystring'),
      cookie = require('../modules/cookie'),
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
    // 如何检查是否登录？ cookie
    let cks = cookie.get(req);
    if(cks.xflogin===undefined) {

        // res.writeHead(302, {
        //     'Cache-Control': 'no-cache',
        //     'location': '/web/login'
        // });
        
        tpl='web/login.html';
    }
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
    let tpl='welcome.html',
        data={};
    ejsq.render(tpl, data, req, res);
};

function post_index(req, res, uri) { // post root
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
