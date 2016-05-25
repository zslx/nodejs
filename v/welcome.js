(function(){
    "use strict";

    vge.setCookie('ckname','客户端设置cookie', 1);

    console.log(vge.getCookie('ssck2'));
    vge.setCookie('ssck2','客户端修改cookie', 1);
    
    vge.cookies(function(cks){
        console.log('document.cookie:', cks);
    });

    if(WebSocket === undefined) {
        alert('不支持 WebSocket');
        return;
    }
    
    var dom_login = document.getElementById('login'),
        wsc = connws( initPage );
    
    function initPage(ws) {
        if(sessionStorage.login !== undefined) { // 有登录凭证 检查是否已经登录
            var cmd={
                a:'chklogin',
                d: sessionStorage.login
            };
            ws.send(JSON.stringify(cmd));
        }else{
            dom_login.innerHTML = '登录';
        }
    }

    dom_login.addEventListener('click', function(ev){
        if(dom_login.innerHTML === '我') { // go home page
            location.href = '/v/web/home.html';
        }else{
            // location.replace('/v/web/login.html');
            location.href = '/v/web/home.html';
        }
    });

    // 登录失效 重新登录
    function login_invalid(){
        delete sessionStorage.login;
        dom_login.innerHTML = '登录';
        // location.replace('/v/mpkf/login.html');
    }

    // 接收信息
    function onmessage(event) {
        console.log('onmessage', event.data);
        var msgar = event.data.split('\r\n');
        switch(msgar[0]) {
        case 'checkLoginOK':
            dom_login.innerHTML = '我';
            break;
        case 'loginInvalid':
            // vge.emit('loginInvalid', msgar.slice(1));
            login_invalid();
            break;
        default:
            dom_messages.innerHTML=msgtpl.replace('${msg}',msgar[0])+dom_messages.innerHTML;
        }
    }

    
    // 不常改
    function connws(cb) {
        var ws = new WebSocket('ws://'+location.host+'/dmo?v=1', ['protocolTxt', 'protocolBin']);
        // 发送信息，当链接成功后
        ws.onopen = function(event){
            console.log('onopen',event);
            // ws.send("链接成功");
            if(cb!==undefined) cb(ws);
        };
        // 错误处理
        ws.onerror = function(event){
            console.log('onerror', event);
            alert('链接错误');
        };
        // 关闭处理
        ws.onclose = function(event){
            console.log('onclose', event);
        };
        ws.onmessage = onmessage;
        return ws;
    }

})();
