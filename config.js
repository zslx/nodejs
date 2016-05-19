'use strict';

exports.tips={
	VVXNetError:'网络繁忙，请您稍后再试',
	VVXCatchError:'访问错误，请您稍后再试'
};

exports.expires = {
    fileMatch: /^(jpg|js|css|png|gif)$/ig,
    maxAge: 606024365
};

exports.compress = {
    match: /css|js|html/ig
};

var os=require('os'), nis=os.networkInterfaces();

const test_server = ['192.168.0.202'];
global.online = true;
(function fipf(x){
	for(var i in x){
		if(typeof x[i]==='object'){
			fipf(x[i]);
		}else{
			console.log('NI:', i, x[i]);
            if(test_server.indexOf(x[i]) !== -1) {
			    global.ip=x[i];
                global.online = false;
			    return;
            }
		}
	}
})(nis);

if(global.online) {
    // 生产环境
    exports.port= process.env.PORT || 5050;
	global.h5server='';

    global.mptoken='fa9e02f774a';
	global.ghid='gh_5c7e7c292230';
	global.APPID='wxef0d04b69d607924'; // 身受心法
	global.APPSEC='fcf6f60824790a9e1fcb9784dca90b9a';
    global.mch_id = ''; // 商户平台
    global.cashapikey = '';     // 微信支付

	global.japi='';
	global.jport=0;
	global.jpath='/interface';

	global.mc={
		nlocation:'', // 缓存地址
        jlocation:''
	};

}else{
    // 开发环境
	exports.port= 8060;
	global.h5server='xd.vjifen.com';

    global.mptoken='vmessage';
	global.ghid='gh_dd59a3b6ac14';     // 原始ID
	global.APPID='wx1ce2ca65ccc5aa5e'; // vjifen品牌服务 vjifenSFW
	global.APPSEC='6edb823280bf9ed0c159acc9afe8c32a';
    global.mch_id = ''; // 商户平台
    global.cashapikey = '';     // 微信支付

	global.japi='';
	global.jport=0;
	global.jpath='/bizInterface';

	global.mc={
		nlocation:'192.168.0.249:54385', // 缓存地址
        jlocation:''
	};
}

console.log(`online:${global.online},h5server:${global.h5server},mc:${global.mc}`);

global.access_token={time:0,token:''};

global.oauth_url=`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${global.APPID}&redirect_uri=`;

global.oauth_args_base = '&response_type=code&scope=snsapi_base&state=tc1#wechat_redirect';

global.oauth_args_adv = '&response_type=code&scope=snsapi_userinfo&state=tc1#wechat_redirect';
