'use strict';
console.log('模块加载时只执行一次？ejsq');
var fs = require('fs'),
    ejs = require('ejs'),
    // LRU = require('lru-cache');
    tpldir='';

// ejs.cache = LRU(100); // LRU cache with 100-item limit
// If you want to clear the EJS cache, call ejs.clearCache. If you're using the LRU cache and need a different limit, simple reset ejs.cache to a new instance of the LRU.

ejs.open='<?'; ejs.close='?>';  // old
ejs.delimiter = '?';            // new

// Unbuffered code for conditionals etc <% code %>
// Escapes html by default with <%= code %>
// Unescaped buffering with <%- code %>

function objempty(o) {
    // 对象没有属性
    for(var x in o) {
        return false;
    }
    return true;
}

exports.setViewPath = function (path) {
	tpldir = path;
};


// 参考 Yii 的脚本处理程序，为 ejs 添加脚本注册能力 :
// registerJS, registerJSFile, registerCSS, registerCSSFile
// 每个页面有自己的 js,css
// es6 class 没有 static 属性，只有 static 方法
class EjsExt {
    // 如何使用？ 用到的时候再设计实现
    // 每个页面一个 render 对象，保存 layout, script,
    constructor(){
        this.scriptFiles=[];
        this.cssFiles=[];
        this.jsscript=[];
        this.csscript=[];
    }
    
    registerJSFile(jsfile, position) {
        // position: POS_HEAD, POS_BODY_BEGIN, POS_BODY_END
    }

    registerJS(js, position) {
    }

    registerCSS(css, position) {
    }

    registerCSSFile(cssfile, position) {
    }

}
// 模拟 static property
EjsExt.POS_HEAD =1;
EjsExt.POS_BODY_BEGIN =2;
EjsExt.POS_BODY_END =3;

exports.piece = (template, options)=> {
	var fpath = tpldir + template;
    console.log('ejs piece',fpath);
	if(fs.existsSync(fpath)) {
		var stats = fs.statSync(fpath);
		if(stats.isFile()) {
			options.filename = fpath;
            try{
	            return ejs.render(fs.readFileSync(fpath,'utf8'), options);
            }catch(e){
                console.log('500 服务器模板参数错误', e);
                return `render Exception ${e}.`;
            }
		}
	}
	return `404 ${fpath} Not Find.`;
};

// template: 模板文件相对路径（相对于 /v）
// options: 模板参数
exports.render = function (template, options, req,res) {
	var fpath = tpldir + template;
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
                    let output = ejs.render(fs.readFileSync(fpath,'utf8'), options);
	                res.end(output);
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
	var path = tpldir + 'wx/' + template;
	if(fs.existsSync(path)) {
		var stats = fs.statSync(path);
		if(stats.isFile()) {
			options.filename = path;
			return ejs.render(fs.readFileSync(path,'utf8'), options);
		}
	}
	return '404 Not Find.';
};
