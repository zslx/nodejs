'use strict';

const nmc = require('../modules/saecache');

// var nmc;
// if(global.online) {
//     // Memcache
//     // 内存容量--2元/GB/天
//     // 请求次数10000 0.25元/百万次
//     // Redis
//     // 内存容量人民币/天
//     // 256M 1元/天
//     nmc = require('../modules/saecache');
// }else{
//     nmc = require('../modules/nmcache');
// }

// 缓存地理信息
exports.xyset=function(k,v){
	nmc.set(['xy',k].join('_'), v.join('L'), 0);
};

exports.xyget=function(k,cb){
	nmc.get(['xy',k].join('_'), function(e, d){
		cb(d);
	});
};

exports.xydel=function(){
	// delete cache.location[k];
	nmc.del(['xy',k].join('_'));
};

// 缓存微信用户信息
exports.del_user = function(openid) {
    nmc.del('user-'+ openid);
};

exports.get_user = function(openid, cb) {
    nmc.get('user-'+ openid, cb);
};

exports.set_user = function(openid,v,t) {
    nmc.set('user-'+ openid, v, t);
};

// wx-jssdk ticket
exports.set_ticket=function(v){
	nmc.set('jsdk-ticket', v, 0, function(e,d){
		console.log('set_ticket',d,e);
	});
};

exports.get_ticket=function(cb){
	nmc.get('jsdk-ticket', function(e, d){
		cb(d);
	});
};

exports.qrmsg_check_v2=function(k,v,cb){
	// 缓存V码
	var k=['qrmsg',k,v].join('_');
	nmc.get(k, function(e, d){
		if(d===undefined){  // 没有重复
			cb(d);
		}else{                  // V码重复
			cb(-1);
		}
		// nmc.set(k, v, 2592000, function(err,data){}); // 一个月过期
		nmc.set(k, 1, global.cache_time, function(err,data){}); // 10分钟
	});
};

exports.qrmsg_check=function(k,v,cb){
	// 缓存最后一个V码的内容和时间
	var k=['qrmsg','check',k].join('_');
	nmc.get(k, function(e, d){
		if(d!==v){			// 没有重复
			cb(d);
		}else{                  // V码重复
			cb(-1);
		}
		nmc.set(k, v, 0);
	});
};
