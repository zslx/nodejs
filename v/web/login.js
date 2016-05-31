(function(){
    "use strict";
    // 微信不支持 => let strtpl
    if(WebSocket === undefined) {
        alert('不支持 WebSocket');
        return;
    }
    var seckeyi='',seckeyv='',
        wsc = connws( initPage );
    
    var form = document.forms[0],
        dom_user = form.elements.inputEmail,
        dom_pwd = form.elements.inputPassword,
        dom_reme = form.elements.rememberMe;

    // 接收信息
    function onmessage(event) {
        console.log('onmessage', event.data);
        var msgar = event.data.split('\r\n');
        switch(msgar[0]) {
        case 'seckey':
            if( msgar.length>1) {
                seckeyi = msgar[1];
                seckeyv = msgar[2];
            }
            console.log(seckeyi,seckeyv);
            // vge.emit();
            break;
        case 'registerOK':
            // 账号已发送到您邮箱，请查收
            break;
        case 'loginOK':
            sessionStorage.xflogin = msgar[1];
            location.replace('/web/my');
            break;
        case 'checkLoginOK':
            location.replace('/web/my');
            break;
        case 'loginInvalid':
            // vge.emit('loginInvalid', msgar.slice(1));
            login_invalid();
            break;
        default:
            alert(event.data);
        }               
    };

    function initPage(ws) {
        var cmd={
            a:'getseckey'        
        };
        if(sessionStorage.xflogin !== undefined) { // 有登录凭证
            cmd.a = 'chklogin';                  // 检查是否已经登录
            cmd.d = sessionStorage.xflogin;
        }
        console.log(cmd);
        ws.send(JSON.stringify(cmd));
    }
    
    // 登录失效？
    function login_invalid(){
        // 登录页
        delete sessionStorage.xflogin;
        console.log('登录失效，请重新登录');
    }
    
    function login(ev){
        // 用户名可解密，密码不可解密
        if(seckeyi.length===0) {
            alert('链接服务器失败，请稍后再试');
            return;
        }
        var user=dom_user.value,
            pwd =dom_pwd.value;
        if(user.length<2) {
            alert('用户名太短');
            return;
        }
        var secpwd = CryptoJS.MD5(pwd + seckeyv),
            secuser= CryptoJS.AES.encrypt(user, seckeyv);
        var data={
            u:secuser.toString(),
            p:secpwd.toString(),
            i:seckeyi,
            a:'login'
        };
        if(pwd.trim().length===0) {
            // 注册
            data.a='register';
        }
        wsc.send(JSON.stringify(data));
    }

    // dom_btn.addEventListener('click', login);
    form.onsubmit=login;
    
    // 不常改
    function connws(cb) {
        var ws = new WebSocket('ws://'+location.host+'/dmo?v=1', ["protocolTxt", "protocolBin"]);
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
