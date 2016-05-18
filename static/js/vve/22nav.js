vge.register('vge',function(g){
    "use strict";
	var z=this;

	// user agent
	var ua = window.navigator.userAgent.toLowerCase(),
		pl = ua.indexOf('('),
		pr = ua.indexOf(')'),
		// uaa=ua.substring(pl,pr).split(/;| /);
		uaa = ua.substring(pl, pr).split(/; | /);

	// window.innerWidth

	// cookies 不同路径下，可以存储同名的cookie
	function cookies(callback){
		var cka = document.cookie.split('; '),l=cka.length,ck,cko={};
		for(var i=0;i<l;++i) {
			ck = cka[i].split('=');
			cko[ck[0]] = ck[1];
		}
		callback(cko);
	};

	function setCookie(cname, cvalue, expire) {
        // expire 过期时间，分钟
        var cookie = [cname + '=' + cvalue];
        if(expire!==undefined) {
		    var d = new Date();
		    d.setTime(d.getTime() + (expire*60*1000));

            cookie.push('expires=' + d.toGMTString());
        }
		document.cookie = cookie.join(';');
	}

    function getCookie(cname) {
        if (document.cookie.length > 0) {
            var start = document.cookie.indexOf(cname + '='),end=0;
            if (start!==-1) { 
                start = start + cname.length+1;
                end = document.cookie.indexOf(";", start);
                if (end === -1) end = document.cookie.length;
                return document.cookie.substring(start, end);
            }
        }
        return '';
    }

	function delCookie(cname) {
		var d = new Date();
		d.setTime(d.getTime() -1);
		document.cookie = [cname, "0; expires", d.toGMTString()].join('=');
	}
    
	z.platform = function() {
		if (ua.indexOf('android') !== -1) {
			return 200;
		} else if (ua.indexOf('iphone') !== -1) {
			return 100;
		} else {
			return 1000;
		}
	};
	z.iswx = function() {
	   return (ua.match(/MicroMessenger/i)!==null);
	};
	z.uaModel = function() {
		if (uaa.length > 5) return uaa[5];
		if (uaa.length > 6) return uaa[6];
		return '';
	};
	z.uaAPN = function() {
		var i = ua.lastIndexOf('nettype');
		if (i !== -1) {
			return ua.substr(i + 8);
		} else {
			return '';
		}
	};

    function closepage(){
        var platform = z.platform(),
            iswx = z.iswx();
        if(iswx) {
            wx.closeWindow();
        }else if(platform ===100) { // ios
            var bridge_iframe_id = 'bridge_iframe',
				bridgeIframe = document.getElementById(bridge_iframe_id);
			if (bridgeIframe === null) {
				bridgeIframe = document.createElement('iframe');
				bridgeIframe.id = bridge_iframe_id;
				bridgeIframe.style.display = 'none';
				bridgeIframe.src = '';
				document.documentElement.appendChild(bridgeIframe);
			}
			var bridge_protocal = 'jsioc://',
                command='close_page';
			bridgeIframe.src = [bridge_protocal, command].join('');
        }else if(platform ===200) { // android
            android.winClose();
        }else{
            window.opener=null;
            window.open('','_self');
            window.close();
        }
    }

    z.closepage = closepage;
    
    z.cookies = cookies;
    z.setCookie = setCookie;
    z.getCookie = getCookie;
    z.delCookie = delCookie;
});
