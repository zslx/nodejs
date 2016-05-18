(function() {
    'use strict';
    var japi = 'http://192.168.0.248:8080/DBTVLog/batchlog/htmlIndex.do'; // V积分开发、测试
/*    if (['m.vjifen.com','x.vjifen.com'].indexOf(location.host) !== -1) {
        japi = 'http://log.vjifen.com:9898/DBTVLog/batchlog/htmlIndex.do'; // V积分、线下活动线上
    }else if(location.host==='vc.vjifen.com') {                            // 会员卡线上
        japi='http://log.vjifen.com:9898/DBTVLog/batchlog/virtualmember.do';
    }else if(['vct.vjifen.com','xd.vjifen.com'].indexOf(location.host) !==-1) { // 会员卡开发、测试
        japi='http://192.168.0.248:8080/DBTVLog/batchlog/virtualmember.do'
    }*/
    if (['m.vjifen.com','vc.vjifen.com','x.vjifen.com', '10.105.19.26:9000', '10.105.19.19:9000'].indexOf(location.host) !== -1) {
        japi = 'http://log.vjifen.com:9898/DBTVLog/batchlog/htmlIndex.do'; // 线上
    }

    //从url获取参数
    function urlparse (url) {
         var search = url.substr(url.indexOf('?') + 1);
        //var search = window.location.search;
        //if (search.indexOf('?') !== -1) search = search.substr(1);
        var ar = search.split('&'),
            params = {},
            args = [];
        for (var l = ar.length - 1; l >= 0; --l) {
            args = ar[l].split('=');
            params[args[0]] = args[1];
        }
        return params;
    }

    function simplelog(optype, pid, eid, pname, openid, userkey, unionid) {
        var params = make_params(),
            info = params.htmlInfo,
            list = params.commandInfo.logList[0];

        // navigator.appVersion
        var ua = window.navigator.userAgent,
            uar = ua.split(' '),
            fa, uao = {};
        for (var l = uar.length - 1; l >= 0; --l) {
            fa = uar[l].split('/');
            uao[fa[0]] = fa[1];
        }
        list.appversion = uao.MicroMessenger;

        list.optype = optype; // 来源操作类型 "1：pv；2：事件 "
        list.cid = pid;
        list.copid = eid;
        list.pagename = pname;
        if(openid===undefined) { // 微信用openid APP用userkey
            info.openid = navigator.appVersion.replace(/ /g,'');
            // info.openid = 'openid';
        }else{
            info.openid = openid;
        }
        list.userkey = userkey===undefined?'':userkey;
        info.unionid = unionid===undefined?'':unionid;
        list.visittime = parseInt(Date.now() / 1000);

        if (uao.MicroMessenger !== undefined) { // 是微信
            if (typeof wx === 'undefined') { // 按需加载 wxsdk
                resload('http://res.wx.qq.com/open/js/jweixin-1.0.0.js', function() {

                    resload("/static/js/wx/jsdk.js", function(){
                        info8wx(params.mobileInfo);
                    });
                });
            } else { // 已经加载了 js-sdk
                info8wx(params.mobileInfo);
            }
        } else { // 不是微信
            params.mobileInfo.apn = uao.NetType;
        }

        function info8wx(minfo) {
            //每次只给用户一次定位信息 如果缓存有 从缓存中获取
            wx.ready(function() {
                wx.getNetworkType({
                    success: function(res) {
                        minfo.apn = res.networkType;
                    }
                });
            });
        }

        // 发送日志
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

    function make_params() {
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
    window.vge_simplelog = simplelog;
    window.url_parse = urlparse;
})();
