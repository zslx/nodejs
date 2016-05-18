// Set-cookie:name=name;expires=date;path=path;domain=domain;secure
// name=name      cookie的值(name不能使用";"和","号),有多个name值时用";"分隔例如：name1=name1;name2=name2;name3=name3
// expires=date   cookie的有效期限,格式为:expires="Wdy,DD-Mon-YYYY HH:MM:SS"
// path=path      设置cookie的路径
//                如果path是一个路径，则cookie对这个目录下的所有文件及子目录生效，例如：path="/cgi-bin/"，如果path是一个文件，则cookie只对这个文件生效，例如：path="/cgi-bin/cookie.cgi"
// domaindomain=domain   对cookie生效的域名，例如：domain="gzdzw.51.net" 
// secure         如果给出此标志，表示cookie只能通过SSL协议的https服务器来传递,cookie的接收是通过设置环境变量HTTP_COOKIE来实现的，CGI程序可以通过检索该变量获取cookie信息 

//实例：
// usr=t=ABCDEFGHIJ&s=23412341234; domain=.stackoverflow.com; expires=Fri, 04-Nov-2011 07:39:57 GMT; path=/; HttpOnly
// hest2=spam, pony2=spam, sovs2=spam; expires=Wed, 04-May-2011 07:51:27 GMT, NO_CACHE=Y; expires=Wed, 04-May-2011 07:56:27 GMT; path=/; domain=.something.d6.revealit.dk

// for(k in cookies) {
// 	v = cookies[k];
// 	cks.push(k+'='+ encodeURIComponent(v)+path+expires);
// }
// response.setHeader('Set-Cookie', cks.join('; '));

// 在cookie 的名或值中不能使用分号（;）逗号（,）等号（=）以及空格
// nodejs cookie api response.setHeader("Set-Cookie", ["type=ninja", "language=javascript;expires=;domain=;path="]);
// 用法 .set(res, ckname, value, expires, domain, path, secure) expires 分钟
exports.set1 = function (response, name, value, expires, domain, path, secure) {
	// expires 设为超时，则删除 cookie
    var cks=response.getHeader('Set-Cookie'),
        cookie = [name, value].join('=');

	if(cks===undefined) { cks=[]; }else{
        // 不覆盖之前设置的 cookie
		if(!(cks instanceof Array)) {
			cks=[cks];
		}
	}

    if(expires!==undefined) {
	    var date=new Date(), now=date.getTime();
		date.setTime(now + expires*60*1000);
        cookie += ';expires=' + date.toGMTString();
    }
    if(domain!==undefined) {
        cookie += ';domain=' + domain;
    }
    if(path!==undefined) {
        cookie += ';path=' + path;
    }
    if(secure!==undefined) {
        cookie += ';' + secure;
    }
    
	cks.push(cookie);
    console.log('set one cookie', cks);
	response.setHeader('Set-Cookie', cks);
}

// 用法 .set(res, {'ckname1':{value:''},'ckname2':{value:'',expires:'min',domain:'',path:'',secure:''}});
exports.setm = function (response, cookies) {
	// expires 设为超时，则删除 cookie
	var date=new Date(),
        now=date.getTime(),
        l = cookies.length,
        k,v,cookie=[],
	    cks=response.getHeader('Set-Cookie');

	if(cks===undefined) { cks=[]; }else{
		if(!(cks instanceof Array)) {
			cks=[cks];
		}
	}

	for(k in cookies) {
		v = cookies[k];
        cookie.push(k + '=' + v.value);
        if(v.expires!==undefined) {
		    date.setTime(now + v.expires*60*1000);
            cookie.push('expires=' + date.toGMTString());
        }
        if(v.domain!==undefined) {
            cookie.push('domain=' + v.domain);
        }
        if(v.path!==undefined) {
            cookie.push('path=' + v.path);
        }
        if(v.secure!==undefined) {
            cookie.push(v.secure);
        }
	    cks.push(cookie.join(';'));
        cookie = [];            // 清空
	}
    console.log('set multi cookie', cks);
	response.setHeader('Set-Cookie', cks);
}

// 在cookie 的名或值中不能使用分号（;）逗号（,）等号（=）以及空格
// nodejs cookie api response.setHeader("Set-Cookie", ["type=ninja", "language=javascript;expires=;domain=;path="]);
// 用法 .set(res, {'name':[value,expires分钟]});
exports.set = function (response, cookies) {
	// expires 设为超时，则删除 cookie
	var date=new Date(),k='',v=[],today=date.getTime(),
	cks=response.getHeader('Set-Cookie');

	if(cks===undefined) { cks=[]; }else{
        // 不覆盖其他地方设置的 cookie
		if(!(cks instanceof Array)) {
			cks=[cks];
		}
	}

	for(k in cookies) {
		v = cookies[k];
		date.setTime(today + v[1]*60*1000);
		cks.push(k + '=' + v[0] + ';expires=' + date.toGMTString());
	}
	response.setHeader('Set-Cookie', cks);
}

exports.get = function(request) {
	var Cookies = {};
    if(request.headers.cookie!==undefined) {
        // k=v;k=v 没有其他 expires,path 等参数（给浏览器用的）
        request.headers.cookie.split(';').forEach(function( Cookie ) {
            var parts = Cookie.split('=');
            Cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
        });
    }
	return Cookies;
}
