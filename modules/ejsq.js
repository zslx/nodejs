'use strict';
console.log('模块加载时只执行一次？ejsq');
var fs = require('fs'),
    ejs = require('ejs'),
    // LRU = require('lru-cache');
    tpl='';


// ejs.cache = LRU(100); // LRU cache with 100-item limit
// If you want to clear the EJS cache, call ejs.clearCache. If you're using the LRU cache and need a different limit, simple reset ejs.cache to a new instance of the LRU.

ejs.open='<?'; ejs.close='?>';  // old
ejs.delimiter = '?';            // new

exports.setViewPath = function (path) {
	tpl = path;
};

// Unbuffered code for conditionals etc <% code %>
// Escapes html by default with <%= code %>
// Unescaped buffering with <%- code %>

function objempty(o) {
    for(var x in o) {
        return false;
    }
    return true;
}

exports.piece = function (template, options, req, res) {
	var fpath = tpl + template;
    console.log('ejs piece',fpath);
	if(fs.existsSync(fpath)) {
		var stats = fs.statSync(fpath);
		if(stats.isFile()) {
			options.filename = fpath;
	        res.writeHead(200, {'Content-Type': 'text/html'});
            try{
	            res.write(ejs.render(fs.readFileSync(fpath,'utf8'), options));
            }catch(e){
                console.log('500 服务器模板参数错误', e);
	            res.end('500 Template param err');
            }
		}
	}
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end( '404 Not Find.');
};

// template: 模板文件相对路径（相对于 /v）
// options: 模板参数
exports.render = function (template, options, req,res) {
	var fpath = tpl + template;
    console.log('ejs render',fpath);
	if(fs.existsSync(fpath)) {
		var stats = fs.statSync(fpath);
		if(stats.isFile()) {
            
            var lastModified = stats.mtime.toUTCString(),
                bm = objempty(options);
			res.setHeader("Cache-Control", 'max-age=0'); 
			res.setHeader("Last-Modified", lastModified);
            
			if (bm && lastModified===req.headers['if-modified-since']) { // Etag
                // 动态生成的页面，不能 304 ，因为模板的数据一直在变
				res.writeHead(304, "Not Modified");
				res.end();
			}else{
			    options.filename = fpath;
	            res.writeHead(200, {'Content-Type': 'text/html'});
                try{
	                res.end(ejs.render(fs.readFileSync(fpath,'utf8'), options));
                }catch(e){
                    console.log('500 服务器模板参数错误',e);
	                res.end('500 Template param err');
                }
            }
            return;
		}
	}
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end( '404 Not Find.');
};

exports.renderxml = function (template, options) {
	var path = tpl + 'wx/' + template;
	if(fs.existsSync(path)) {
		var stats = fs.statSync(path);
		if(stats.isFile()) {
			options.filename = path;
			return ejs.render(fs.readFileSync(path,'utf8'), options);
		}
	}
	return '404 Not Find.';
};
