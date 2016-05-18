vge.register('vge', function(g) {
	"use strict";
	var z = this;
	z.createXHR = function() {
		// 创建异步调用对象，兼容性封装
		// readyState属性包括五种可能的取值：
		// 0：（未初始化）send方法还没有被调用
		// 1：（加载中）已调用了send方法，请求还在处理
		// 2：（已加载）send方法已完成，整个应答已接收
		// 3：（交互中）正在解析应答
		// 4：（已完成）应答已经解析，准备好进行下一步处理
		var createXHR;
		if (typeof XMLHttpRequest !== 'undefined') {
			createXHR = function() { // 延迟加载，重写现有函数，防止重复判断
				return new XMLHttpRequest();
			};
		} else if (typeof ActiveXObject !== 'undefined') {
			if (!vge.isString(z.activeXv)) {
				var versions = ['MSXML2.XMLHttp.6.0', 'MSXML2.XMLHttp.3.0', 'MSXML2.XMLHttp'],
					i, len, xhr = null;
				for (i = 0, len = versions.length; i < len; ++i) {
					try {
						xhr = new ActiveXObject(versions[i]);
						z.activeXv = versions[i];
						// delete xhr;
						xhr = null;
						break;
					} catch (ex) {}
				}
			}
			createXHR = function() {
				return new ActiveXObject(z.activeXv);
			};
		} else {
			throw new Error('No XHR object available.');
		}
		return createXHR();
	};

	z.ajxget = function(url, timeout, okf, errf) {
		// 封装 get 方式的异步调用
		// MutationObserver load ready change ???
		var xhr = vge.createXHR(),
			tot = null;
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
                if( xhr.status === 200 ) {
				    if (tot !== null) {
					    clearTimeout(tot);
					    tot = null;
				    }
				    if(okf!==undefined) {
                        okf(xhr.responseText);
                    }
				    xhr = null; // 释放内存
                }else{
                    // console.log('网络错误');
                }
			}
		};
		xhr.open('GET', url, true);
        xhr.send(null);
        if(timeout!==undefined) {
		    tot = setTimeout(function() {
			    xhr.abort();
			    // delete xhr;
			    xhr = null;
			    if (errf!==undefined) {
                    errf('网络请求超时了');
                }
		    }, timeout);
        }
	};
    
	//post请求
	z.ajxpost = function(url, data, timeout, okf, errf) {
		// 封装 post 方式的异步调用
		var xhr = z.createXHR(),
			tot = null;
		xhr.onreadystatechange = function() {
			// console.log('readyState:' + xhr.readyState + ' status:' + xhr.status);
			if (xhr.readyState === 4 && xhr.status === 200) {
				if (tot !== null) {
					clearTimeout(tot);
					tot = null;
				}
				// xhr.getResponseHeader('Date')
				// xhr.getAllResponseHeaders()
				if(okf!==undefined) okf(xhr.responseText);
				xhr = null; // 释放内存
			}
		};
		xhr.open('POST', url, true);
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		// xhr.setRequestHeader('Content-type','application/json'); // 会出跨域错误
		// server set header('Access-Control-Allow-Origin','*'); // 跨域
		tot = setTimeout(function() {
			// delete xhr;
			// xhr.abort(); xhr=null;
			if (!!errf) errf('网络请求超时了');
		}, timeout);
		xhr.send(data);
	};
	//接受一个url路径
	z.syncget = function(url) {
		var xhr = vge.createXHR();
		xhr.open('GET', url, false);
		xhr.send(null);
		// xhr.ontimeout
		return xhr.responseText;
	};

	z.callJApi=function(api, params, callback, log){
        var ps = JSON.stringify(params);
		vge.ajxpost(api, ps, 30000, function(r) {
			try {
				var jo = JSON.parse(r);
				if (jo.result.code === '0') {
                    if(log!==undefined) z.clog('debug',[api,ps,r]);
					if(z.isFunction(callback)) callback(jo);
				} else {
					z.clog('errmsg',[api,ps,r]);
                    // clog: api, ps, r
				}
			} catch (e) {
				z.clog('errmsg',[api,e,r]);
			}
		},function(e){
			z.clog('errmsg',[api,e,ps]);
		});
	};

    z.clog=function(type,arr){
        // z.ajxget('http://' + location.host + '/clog?url='+encodeURIComponent(location.pathname) +'&'+type+'=' +encodeURIComponent(arr.join(' ')), 5000, function(r) {});
        var d=new Date(),
            url = encodeURIComponent(location.pathname),
            msg = encodeURIComponent(arr.join(' ')),
            tst = [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
        z.ajxget('/clog?'+tst +url+ '&'+ type+'='+msg, 5000, function(r) {});
    };

    // 获取 URL 参数 【临时放在这里】
	z.urlparse = function(url) {
		 var search = url.substr(url.indexOf('?') + 1);
		//var search = window.location.search;
		//if (search.indexOf('?') !== -1) search = search.substr(1);
		var ar = search.split('&'),
			params = {},
			args = [];
		for (var l = ar.length - 1; l >= 0; --l) {
			args = ar[l].split('=');
            if(args.length<2) {
			    params[args[0]] = '';
            }else{
			    params[args[0]] = args[1];
            }
		}
		return params;
	};
    
	//去除html tag的正则表达式
	z.setContent = function(str) {
		str = str.replace(/<\/?[^>]*>/gmi, ''); //去除HTML tag 全局 多行 不区分大小写
		str = str.replace(/[ | ]*\n/g, '\n'); //去除行尾空白
		//str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
		return str;
	};
	// using
	// var args = vge.urlparse(url);
	// alert(args.openid);

    if(z.renderTpl === undefined ) {
	    z.renderTpl = function(tpl, data) {
		    // 模板渲染函数
		    // 参数
		    // tpl： 模板， 字符串类型
		    // data:用于实例化模板的数据， json 对象
		    var k = '',
			    v = '',
                x,
			    r = tpl;
		    for (x in data) {
			    k = '\\[=' + x + '\\]';
			    r = r.replace(new RegExp(k, 'gi'), data[x]);
		    }
		    return r;
	    };
    }

});
