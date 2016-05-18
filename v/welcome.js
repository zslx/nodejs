(function(){
    "use strict";

    vge.setCookie('ckname','客户端设置cookie', 1);

    console.log(vge.getCookie('ssck2'));
    vge.setCookie('ssck2','客户端修改cookie', 1);
    
    vge.cookies(function(cks){
        console.log('document.cookie:', cks);
    });
    
})();
