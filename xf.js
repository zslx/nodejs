global.cfg = require('./config');
global.bzcfg = {};
global.fsroot = __dirname;
// console.log('__dirname,__filename', __dirname,__filename);

const server=require('./modules/server');
// 初始化
var businesscfg = global.fsroot + '/biz.cfg';
server.readcfg(businesscfg, global.bzcfg);

const fs = require('fs'),
      router=require('./modules/router'),
      ejsq = require('./modules/ejsq');

router.setpath(__dirname);
ejsq.setViewPath( __dirname+'/v/');

router.map({ url:'/', controller:'web' });
router.map({ method:'post', url:'/', controller:'web', action:'phome' });

// 监控文件变化 vim无效(会触发 rename + change)
var fswatcher=null,fstimer=null;
function watcherr(e){
    console.log('watcherr',e);
}
function watcher(event,filename) {
	console.log('fs watch:',event,filename);
	if(event==='change') {		// 重新加载
        // global.bzcfg = {};      // 清空，对象被替换，原有对象还在
        // var bzcfg = global.bzcfg; // 这样不行，因为每次修改重新加载时，对象被替换了

        server.readcfg(businesscfg, global.bzcfg);
	}else if(event ==='rename'){
        if(fswatcher!==null) {
            fswatcher.close();
            fswatcher=null; 
        }
        fstimer=setTimeout(function(){
            fswatcher = fs.watch(businesscfg, watcher);
            fswatcher.on('error', watcherr);
        },1000);
    }
}
fswatcher = fs.watch(businesscfg, watcher);
fswatcher.on('error', watcherr);

server.start(global.cfg.port);
require('./c/wx');              // 预加载

// /* Enjoy it! */
