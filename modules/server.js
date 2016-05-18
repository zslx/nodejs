'use strict';
var http = require('http'),
    fs = require('fs'), 
    url = require('url'), 
    router = require('./router'),
    ws = require('./ws'),
	// nmc = require('./nmcache'),
    staticf = require('./staticf');

exports.readcfg = readconfig;

exports.start=function(port) {
	function onRequest(req, res) {
        // console.log('ws debug',req.upgrade); // upgrade 请求不会到这里
		var uri=url.parse(req.url, true),
		    i=uri.pathname.lastIndexOf('.')+1,
            ctype='',
            ext='';
		if(i>0 ) { // 资源类型
			ext=uri.pathname.substr(i).toLowerCase();
			ctype=staticf.types[ext];
		}
        
		if(ctype===''||ctype===undefined) {
	        router.route(req, res, uri);
		}else{ // 静态资源
            // V积分 兼容旧版APP
            if(uri.pathname.indexOf('/static/rebate_share')!==-1) {
			    staticf.r(uri.pathname.replace('static','v/vjf'), ext,ctype,req,res);
            }else{
			    staticf.r(uri.pathname, ext, ctype, req, res);
            }
		}
	};
	// http.createServer(onRequest).listen(port,global.h5server);
	// http.createServer(onRequest).listen(port,'192.168.0.202');
	// http.createServer(onRequest).listen(port,'127.0.0.1');
	// http.createServer(onRequest).listen(port,'0.0.0.0');

    function ontimeout(socket){
        console.log('server.js client connect timeout',socket._handle.fd);
    }
    
	var server = http.createServer(onRequest);
    // server.setTimeout(240000, ontimeout); // 6 分钟, Default = 120000 (2 minutes)
    server.on('timeout', ontimeout);

    server.on('upgrade', ws.onupgrade); // websocket 处理
    
    server.listen(port);
    
	console.log(`Server has started at host:${port}`);
}

function readconfig(fpath, bzcfg) {
    // 加载配置文件、更新配置文件、如果有缓存，则不更新该key
    if(fs.existsSync(fpath)) {
        var fd = fs.openSync(fpath, 'r'),
            buf = fs.readFileSync(fpath);
        fs.closeSync(fd);
        var lines = buf.toString().split('\n'),
            l = lines.length, k='', v='',i=0,ss='', p=0, keys=[];
        // console.log('readconfig', l, lines);

        // // global.bzcfg = {};      // 清空，对象被替换，原有对象还在
        // for(k in bzcfg) {       // 做清空操作，在运行中可能会导致问题
        //     delete bzcfg[k];    // 不清空，则删除某个key，做不到？ 需要删除吗
        // }
        
        console.log('readconfig empty', global.bzcfg);
        
        for(i=0;i<l;++i) {
            ss = lines[i];
            if(ss==='' || ss[0]===';')continue;
            p = ss.indexOf('=');
            if(p!==-1) {
                k = ss.substr(0,p).trim();
                v = ss.substr(p+1).trim();
                if(k.length>2 && k[0]==='#' && k[0]===k[1]) { // json
                    keys.push(k.substr(2));
                    bzcfg[k.substr(2)] = JSON.parse(v);
                }else if(k.length>2 && k[0]==='$' && k[0]===k[1]) { // route
                    keys.push(k.substr(2));
                    bzcfg[k.substr(2)] = {t:'r',v:v};
                }else if(k.length>3 && k.substr(0,3)==='[i]') { // int
                    keys.push(k.substr(3));
                    bzcfg[k.substr(3)] = {t:'i',v: parseInt(v,10)};
                }else if(k.length>3 && k.substr(0,3)==='[f]') { // float
                    keys.push(k.substr(3));
                    bzcfg[k.substr(3)] = {t:'f',v:parseFloat(v)};
                }else{          // string
                    keys.push(k);
                    bzcfg[k] = v.replace(/\\n/g,'\n');
                }
            }
        }
        
        // 检查缓存，使用缓存中的值，注意配置文件key命名和缓存key的命名，冲突
        function dkclosure(dk){
            return function(e, d){
                if(d!==undefined) {
                    // delete bzcfg[dk]; // 是否？
                    bzcfg[dk] = d;
                    console.log('readconfig dbg',dk,d);
                }else{
                    console.log('readconfig dbg no cache',bzcfg[dk]);
                }
            };
        }
        l=keys.length;
        
        // for(i=0;i<l;++i) {
        //     nmc.get(keys[i], dkclosure(keys[i]) );
        // }
        
    }else{
        console.log('file [%s] not found',fpath);
    }
    console.log('readconfig', global.bzcfg);
}
