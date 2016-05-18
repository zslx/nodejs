// 使用指南：业务需要openid的模块，负责存储openid到 localStorage.vjf_real_openid
(function() {
    'use strict';
    var a_option = {};
    var japi = 'http://192.168.0.248:8080/DBTVLog/batchlog/htmlIndex.do'; //开发测试
    if (['m.vjifen.com','vc.vjifen.com','x.vjifen.com','10.105.19.26:9000', '10.105.19.19:9000'].indexOf(location.host) !== -1) {
        japi = 'http://log.vjifen.com:9898/DBTVLog/batchlog/htmlIndex.do'; // 线上
    }

    function biglog(opname, optype, pid, eid, pname, openid, userkey, option) {
        if (option !== undefined) {
            a_option = option;
        }
        var params = grab_params(),
            info = params.htmlInfo,
            list = params.commandInfo.logList[0];

        info.unionid = '';
        info.openid = openid;
        info.opname = opname; // 当前操作接口名
        list.optype = optype; // 来源操作类型 "1：pv；2：事件 "
        list.pagename = pname;
        list.cid = pid;
        list.copid = eid;
        list.visittime = parseInt(Date.now() / 1000);
        //app端的处理，不在微信里，没有openid
        list.userkey = userkey;

        var ua = window.navigator.userAgent,
            uar = ua.split(' '),
            fa, uao = {};
        for (var l = uar.length - 1; l >= 0; --l) {
            fa = uar[l].split('/');
            uao[fa[0]] = fa[1];
        }
        list.appversion = uao.MicroMessenger;

        if (uao.MicroMessenger !== undefined) { // 是微信
            if (typeof wx === 'undefined') { // 按需加载
                // 加载 wxsdk
                resload('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function() {
                    resload("/static/js/wx/jsdk.js", info8wx);
                });

            } else { // 已经加载了 js-sdk
                info8wx();
            }
        } else { // 不是微信
            info8h5(uao);
        }

        function info8h5(o) {
            params.mobileInfo.apn = o.NetType;
            if (a_option.h5geolocation === undefined) {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function showPosition(p) {
                        list.longitude = p.coords.longitude;
                        list.latitude = p.coords.latitude;
                        list.accuracy = 1;
                    }, function showError(e) {
                        //					alert('info8h5 err:'+e.code);
                    });
                } else {}
            }
        }

        function info8wx() {
            //每次只给用户一次定位信息 如果缓存有 从缓存中获取
            if (localStorage.vjf_h5_location !== undefined) {
                if ((Date.now() - parseInt(localStorage.vjf_h5_location, 10)) / 1000 > 12 * 3600) {
                    localStorage.vjf_h5_location = undefined;
                }

                var lng = localStorage.getItem('longitude'),
                    lat = localStorage.getItem('latitude'),
                    acy = localStorage.getItem('accuracy');

                list.longitude = lng;
                list.latitude = lat;
                list.accuracy = acy;
            } else {
                wx.ready(function() {
                    // 微信版
                    wx.getNetworkType({
                        success: function(res) {
                            params.mobileInfo.apn = res.networkType;
                        }
                    });
                    if (a_option.wxgeolocation === undefined) {
                        wx.getLocation({
                            success: function(res) {
                                list.longitude = res.longitude;
                                list.latitude = res.latitude;
                                list.accuracy = res.accuracy;
                                localStorage.setItem("longitude", res.longitude);
                                localStorage.setItem("latitude", res.latitude);
                                localStorage.setItem("accuracy", res.accuracy);
                            },
                            cancel: function(res) {}
                        });
                    }
                });
                localStorage.vjf_h5_location = Date.now();
            }
        }

        // 调用发送日志

        ajxpost(japi, JSON.stringify(params), function(r) {});
    }

    function ajxpost(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                callback(xhr.responseText);
                xhr = null; // 释放内存
            }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.send(data);
    }

    function grab_params() {
        var params = {
            "requestTime": parseInt(Date.now() / 1000),
            "commandType": "handleBatchLog",
            "clientInfo": {
                "platformId": (/android/i.test(navigator.userAgent)) ? 200 : 100
            },
            "mobileInfo": {
                "apn": '' // 联网方式
            },
            "htmlInfo": {
                "requrl": window.location.href
            },
            "commandInfo": {
                "applicationtype": 3,
                "logList": [{
                    "visittime": 0, // 操作时间
                    "cid": "pageID",
                    "copid": "opid",
                    "optype": 0, // "1：pv；2：事件 "
                    "pagename": "",
                    "pageloadtime": 0, // 页面加载时间
                    "apptype": 3, // 1：V积分APP；2：H5站；3：微信
                    "appversion": "wechat",
                    "coordinate": '', // "坐标系统名称[地市]",
                    "longitude": "",
                    "latitude": "",
                    "extend": ""
                }]
            }
        };
        return params;
    }

    function resload(urls, cb) {
        var head = document.head || document.getElementsByTagName('head')[0],
            node = document.createElement('script');
        var nn = null,
            cnt = urls.length,
            count = 0;

        function wait() { // 等待多个js文件都加载
            if (++count >= cnt) {
                cb();
            }
        }
        if (Object.prototype.toString.call(urls) === "[object Array]") {

            for (var i = 0; i < cnt; ++i) {

                nn = node.cloneNode();
                nn.setAttribute('src', urls[i]);
                nn.setAttribute('charset', 'utf-8');
                nn.onload = wait;
                head.appendChild(nn);

            }

        } else if (Object.prototype.toString.call(urls) === "[object String]") {
            node.setAttribute('src', urls);
            node.setAttribute('charset', 'utf-8');
            node.onload = cb;
            head.appendChild(node);
        }
    }

    // getopenid: 获取openid的顺序，url参数，本地缓存localStorage, 临时分配，必要时从微信获取。
    function getopenid(cb, openidArg, userkeyArg) {
        if (openidArg === undefined) openidArg = 'openid';
        if (userkeyArg === undefined) userkeyArg = 'userkey';
        var search = window.location.search,
            params = {},
            openid = '',
            userkey = '';
        if (search.indexOf('?') !== -1) { // 1 从url获取
            search = search.substr(1);
            var ar = search.split('&'),
                args = [];
            for (var l = ar.length - 1; l >= 0; --l) {
                args = ar[l].split('=');
                params[args[0]] = args[1];
            }
        }

        if (params[openidArg] !== undefined) { // 风险：url上的openid 不一定是打开者的。
            openid = params[openidArg];
            localStorage.vjf_real_openid = openid;
            // alert('openid from url'+openid);
        } else {
            userkey = params[userkeyArg];
            if (sessionStorage.wxopenid) {
                openid = sessionStorage.wxopenid;
            } else {
                if (localStorage.vjf_real_openid === undefined) {
                    if (localStorage.vjf_temp_openid === undefined) { // 分配临时id
                        localStorage.vjf_temp_openid = [Date.now(), Math.random()].join(''); // 31byte
                    }
                    openid = localStorage.vjf_temp_openid;
                    // alert('tmp openid from localStorage'+openid);
                } else { // 获取其他页面存的id
                    openid = localStorage.vjf_real_openid;
                    // alert('openid from localStorage'+openid);
                }
            }
        }
        cb(openid, userkey);
    }

    window.vge_getopenid = getopenid;
    window.vge_biglog = biglog;

    // window.addEventListener('beforeunload',function(ev){
    // 系统会弹出关闭确认弹窗
    //     // console.log('beforeunload');
    //     ev.returnValue='关闭页面';
    //     return ev.returnValue;
    // });

})();
