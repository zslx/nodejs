exports.tips={
	VVXNetError:'网络繁忙，请您稍后再试',
	VVXCatchError:'访问错误，请您稍后再试'
};

var os=require('os'), nis=os.networkInterfaces();

(function fipf(x){
	for(var i in x){
		if(typeof x[i]==='object'){
			fipf(x[i]);
		}else{
			console.log('NI:', i, x[i]);
			global.ip=x[i];
			return;
		}
	}
})(nis);

exports.expires = {
    fileMatch: /^(jpg|js|css|png|gif)$/ig,
    maxAge: 606024365
};

exports.compress = {
    match: /css|js|html/ig
};

exports.port= process.env.PORT || 5050;
