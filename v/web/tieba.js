(function(){
    "use strict";
    if(WebSocket === undefined) {
        alert('不支持 WebSocket');
        return;
    }
    var wsc = connws( initPage );
    
    function initPage(ws) {
        if(sessionStorage.login !== undefined) { // 有登录凭证 检查是否已经登录
            var cmd={
                a:'chklogin',
                d: sessionStorage.login
            };
            ws.send(JSON.stringify(cmd));
        }
    }

    // 登录失效 重新登录
    function login_invalid(){
        delete sessionStorage.login;
        // location.replace('/v/mpkf/login.html');
    }

    // 接收信息
    function onmessage(event) {
        console.log('onmessage', event.data);
        var msgar = event.data.split('\r\n');
        switch(msgar[0]) {
        case 'checkLoginOK':
            break;
        case 'loginInvalid':
            // vge.emit('loginInvalid', msgar.slice(1));
            login_invalid();
            break;
        default:
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
