'use strict';
// 2016-05-18 17:42:50  zsl
// key = appid_sceneid-keyname  eg. vjfappid_wxjsdk_ticket
// val = time_value
// appid or server.host ?

const memjs = require('memjs'),
      util = require('util');

var nmc;
if(process.env.MEMCACHE_SERVERS) { // sae online
    nmc = memjs.Client.create(process.env.MEMCACHE_SERVERS, {
        username: process.env.ACCESSKEY,
        password: process.env.SECRETKEY
    });
}else{
    nmc = memjs.Client.create(global.mc.nlocation);
}

function mccb(e,d,v){
    console.log(`err:${e},result:${d},value:${v}`);
	if(e){
		console.log('memjs err',e);
	}
}

// common interface
exports.set=(k,v,t,cb)=>{
    if(cb===undefined) {
        cb = mccb;
    }
    var key=[global.APPID,k].join('_'), val=[Date.now(),v].join('_');
	nmc.set(key, val, cb, t);
};

exports.append = (k,v,cb)=> {
    console.log('append is undefined.');
};

exports.incr = (k,v)=> {
    var key=[global.APPID,k].join('_');
    nmc.increment(key,v,mccb);
};

exports.decr = (k,v)=> {
    var key=[global.APPID,k].join('_');
    nmc.decrement(key,v,mccb);
};

exports.get=(k,cb)=>{
    var key=[global.APPID,k].join('_');
	nmc.get(key, (e, d, i)=>{
        // console.log(d); // 返回的是 buffer 不是 string
		if(!e) {
            if(d!==null) {
                // d = d.split('_')[1]; // 数据值有下划线
                // d = d.substr(d.indexOf('_')+1);
                d = d.slice(d.indexOf('_')+1);
            }
			cb(e, d, i);
		}else{
			console.log('mcget memcached get err ',e,k);
		}
	});
};

exports.del=(k, cb)=>{
    var key=[global.APPID,k].join('_'); // val=[Date.now(),v].join('_');
    if(cb===undefined) cb=mccb;
	nmc.delete(key, cb);
    // console.log('del', k);
};
