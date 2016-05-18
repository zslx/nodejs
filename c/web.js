'use strict';
console.log('模块加载时只执行一次？web');
// 主站 Controller
var querystring = require('querystring'),
    ejsq = require('../modules/ejsq');


exports.index=index;            // page index action
exports.phome=post_index;       // for post

function index(req, res, uri) { // get root
    let tpl='welcome.html',
        data={};
    ejsq.render(tpl, data, req, res);
}

function post_index(req, res, uri) { // post root
    var bufs = [], size=0;
	req.on('data',function(chunk){
	    bufs.push(chunk);
        size += chunk.length;
	}).on('end', function() {
        let buf = Buffer.concat(bufs, size),
            postData = buf.toString('utf-8');
		// var fields = querystring.parse(postData);
        console.log('web post_index', postData);
		res.writeHead(200, {'Content-Type': 'text/html'});
		// res.end(decodeURIComponent(postData));
		res.end('');
	});
}
