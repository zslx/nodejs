exports.types = {
    "html": "text/html",
    "css": "text/css",
    "map": "text/map",
    "js": "text/javascript",
	"mf": "text/cache-manifest",
    "manifest":"text/cache-manifest",
    "jpg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "jpeg": "image/jpeg",
    "ico": "image/x-icon",
    "json": "application/json",
    "xml": "text/xml",
    "pdf": "application/pdf",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "ogg": "audio/ogg",
	"mp3": "audio/mpeg",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "ttf": "application/x-font-ttf"
};

var fs = require('fs'),
    path = require('path'),
    ejsq = require('./ejsq'),
    zlib=require('zlib');

var fsroot = global.fsroot;
var cdirs=['/static/','/v/'];       // 允许客户端访问的目录白名单
console.log('client dirs:', cdirs );
// require 方法的坐标路径是 module.filename/__filename; fs.readFile 的坐标路径是 process.cwd

exports.r = function (fpath, ext, contentType, req, res) {
    fpath = path.normalize(fpath);
    var fullpath = '';
    if(fpath.indexOf('%')!==0) {
        fullpath = [fsroot,decodeURIComponent(fpath)].join('');
    }else{
        fullpath = [fsroot,fpath].join('');
    }
    // console.log('fsroot,fpath', fsroot, fpath, fullpath);
    if( ext!=='ico' && // except favicon.ico
        fpath.indexOf(cdirs[0]) !== 0 &&
        fpath.indexOf(cdirs[1]) !== 0 ) {
        // 非法目录
        console.log('staticf 非法访问', fpath);
        res.writeHead(200, "Ok");
        res.end('V积分');
        return;
    }
    // ext css, js 进行压缩并缓存 2015-12-30 16:14:22 
    
    // console.log('basename,dirname', path.basename(fpath), path.dirname(fpath) );
    // console.log('staticf.js debug %s\n%s\n%s', process.env.PWD, fpath);
    
	fs.stat(fullpath, function(err,stats) {
		if(err===null && stats.isFile()) {
			var lastModified=stats.mtime.toUTCString(),
            maxage='';

			res.setHeader("Last-Modified", lastModified); // server,Etag
            if(ext === 'html') {
                console.log('staticf.js ', req.url);
                maxage='max-age=0'; // 每次检查html有无更改
            }else{                  // 其他资源(css,js,img)用 URL?v更新
                // console.log('staticf.js ', req.url);
                maxage='public, max-age=31536000'; // 一年
            }
			res.setHeader("Cache-Control", maxage);       // 资源缓存时间

			if (lastModified===req.headers['if-modified-since']) { // Etag
				res.writeHead(304, "Not Modified");
				res.end();
			}else{
				res.setHeader('Content-Type', contentType);
                res.setHeader('Vary','Accept-Encoding'); // 压缩相关
                // var key=fpath.replace(/\//g,'_');
                // nmc.get(key,function(e,d){ // 为时尚早,若加缓存,文件更新时需清缓存
                reply(fullpath, stats.size, req,res);
			}

		}else{
			console.log('fs stat err %j',err);
			// res.writeHead(404, {'Content-Type':'text/plain'});
			// res.end('Request URL '+fpath+ ' was not found on server.');
            ejsq.render('404.html',{msg:fpath}, req, res);
		}
	});
};

function reply(fpath, size, req, res) {
    var raw = fs.createReadStream(fpath),
        acceptEncoding = req.headers['accept-encoding'] || "",
        matched = false;
    // matched = ext.match(global.cfg.compress.match);
    if (matched && acceptEncoding.match(/\bgzip\b/)) {
        // console.log('accept-encoding gzip');
        // res.setHeader('Content-Length', gzlen);
        res.writeHead(200, "Ok", {'Content-Encoding': 'gzip'});
        raw.pipe(zlib.createGzip()).pipe(res);
    } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
        // console.log('accept-encoding deflate');
        // res.setHeader('Content-Length', deflen);
        res.writeHead(200, "Ok", {'Content-Encoding': 'deflate'});
        raw.pipe(zlib.createDeflate()).pipe(res);
    } else {
        // console.log('accept-encoding nozip');
        res.setHeader('Content-Length', size);
        res.writeHead(200, "Ok");
        raw.pipe(res);
    }
}
