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

// ejs.filters 一些辅助函数，用于模版中使用 
// 1)、first，返回数组的第一个元素； 
// 2)、last，返回数组的最后一个元素； 
// 3)、capitalize，返回首字母大写的字符串； 
// 4)、downcase，返回字符串的小写； 
// 5)、upcase，返回字符串的大写； 
// 6)、sort，排序（Object.create(obj).sort()？）； 
// 7)、sort_by:'prop'，按照指定的prop属性进行升序排序； 
// 8)、size，返回长度，即length属性，不一定非是数组才行； 
// 9)、plus:n，加上n，将转化为Number进行运算； 
// 10)、minus:n，减去n，将转化为Number进行运算； 
// 11)、times:n，乘以n，将转化为Number进行运算； 
// 12)、divided_by:n，除以n，将转化为Number进行运算； 
// 13)、join:'val'，将数组用'val'最为分隔符，进行合并成一个字符串； 
// 14)、truncate:n，截取前n个字符，超过长度时，将返回一个副本 
// 15)、truncate_words:n，取得字符串中的前n个word，word以空格进行分割； 
// 16)、replace:pattern,substitution，字符串替换，substitution不提供将删除匹配的子串； 
// 17)、prepend:val，如果操作数为数组，则进行合并；为字符串则添加val在前面； 
// 18)、append:val，如果操作数为数组，则进行合并；为字符串则添加val在后面； 
// 19)、map:'prop'，返回对象数组中属性为prop的值组成的数组； 
// 20)、reverse，翻转数组或字符串； 
// 21)、get:'prop'，取得属性为'prop'的值； 
// 22)、json，转化为json格式字符串
//

// ejs.filters.test = function(data) {
//   return '"'+data+'"';
// };
// A filter is applied to some data with the following syntax.
//     <%=: data | test %>
// Where you are missing the =: and the data to be filtered.
    

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
    // 扫描文件，找到所有的 register[css/js/file][head,begin,end] 取得文件路径或代码片段
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
                bm = objempty(options); // 有无模板数据
			res.setHeader("Cache-Control", 'max-age=0'); // 浏览器不缓存
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
