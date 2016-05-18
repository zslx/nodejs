// 2016-05-18 17:42:50  zsl
// key = appid_sceneid-keyname  eg. vjfappid_wxjsdk_ticket
// val = time_value
// appid or server.host ?

var mcd = require('memcached'),
    util = require('util'),
    nmc = new mcd(global.mc.nlocation);

// key: String the name of the key
// value: Mixed Either a buffer, JSON, number or string that you want to store.
// lifetime: Number, how long the data needs to be stored measured in seconds
// callback: Function the callback

function mccb(e,d){
	if(e!==undefined){
		console.log('memcached err',e);
	}
}

// common interface
exports.set=function(k,v,t,cb){
    if(cb===undefined) {
        cb = mccb;
    }
    var key=[global.APPID,k].join('_'), val=[Date.now(),v].join('_');
	nmc.set(key, val, t, cb);
};

exports.append = function(k,v,cb) {
	// append 必须是已有记录，否则会失败。先执行 nmc.set
    // var key=[global.APPID, k].join('_'), val=[Date.now(), v].join('_');
    // append 拼接多个值时，插入其他内容导致 split 时出问题。 reciept_set/get
    // [ 'http://mmbiz.qpic.cn/mmbiz/3zAwya47yia9pp9LwGgqvV3PxpqzA/01451527855011_',
    // 'http://mmbiz.qpic.cn/mmbiz/8ERhiaNzDOequBMkGuUOhF9UYuYG0w/01451527915253_',
    // 'http://mmbiz.qpic.cn/mmbiz/3zAwcx1z57VI7EMMhbhA16W1y5T97n0M6Tllcic7P5OrQ/0' ]

    var key=[global.APPID, k].join('_');
    if(cb===undefined) {
        cb = mccb;
    }
	nmc.append(key, v, cb);
};

exports.incr = function(k,v) {
    var key=[global.APPID,k].join('_');
    nmc.incr(key,v,mccb);
};

exports.decr = function(k,v) {
    var key=[global.APPID,k].join('_');
    nmc.decr(key,v,mccb);
};

exports.get=function(k,cb){
    var key=[global.APPID,k].join('_'); // val=[Date.now(),v].join('_');
	nmc.get(key, function(e, d){
		if(e===undefined){
            if(d!==undefined) {
                // d = d.split('_')[1]; // 数据值有下划线
                d = d.substr(d.indexOf('_')+1);
            }
			cb(e, d);
		}else{
			console.log('mcget memcached get err ',e,k);
		}
	});

};

exports.del=function(k, cb){
    var key=[global.APPID,k].join('_'); // val=[Date.now(),v].join('_');
    if(cb===undefined) cb=mccb;
	nmc.del(key, cb);
    // console.log('del', k);
};

exports.slabs=function(cb){
    // cb(err, result)
    nmc.slabs(cb);
};

exports.dump=function(){
    var slabid=0, item;
    nmc.items( function( err, result ){
	    if(err){
            console.error( err );
        }else{
	        result.forEach(function( itemSet ){ // for each server... 
		        var keys = Object.keys( itemSet );
			    keys.pop(); // we don't need the "server" key, but the other indicate the slab id's
                console.log('keys size:',keys.length);
		        keys.forEach(function( stats ){ // get a cachedump for each slabid and slab.number
                    slabid = parseInt(stats);
                    item = itemSet[slabid];
                    console.log(slabid, item.number, item.age);
			        nmc.cachedump(itemSet.server, slabid, item.number, function(err,response ){
				        // dump the shizzle
                        if(err) console.log(err); // JSON.stringify( response );
                        if(util.isArray(response)) {
                            response.forEach(function(ele){
                                if(ele.key[0]==='w'&&ele.key[1]==='x')
                                    console.log('arkey:',ele.key);
                            });
                        }else{
                            if(response.key[0]==='w'&& response.key[1]==='x')
				                console.log('key:', response.key);
                        }
			        });
		        });
	        });
        }
    });
};
