(function() {
    "use strict";
	var access_token='',
        limit = (location.search.indexOf('limit=')!==-1);

	var info=document.getElementById('info'),
		vxapi='https:/mp.weixin.qq.com/cgi-bin/showqrcode?ticket=',
		qrimg = document.getElementById('qrimg'),
	    sceneid = document.getElementById('sceneid'),
        qrbtn = document.getElementById('showqr');

        qrbtn.removeAttribute('disabled');
    
    info.innerHTML = '微信参数二维码：【1 ~ 1500】';

    qrbtn.addEventListener('click', function(ev) {
        var sid = sceneid.value.trim(), napi='';
        if(sid.length<1) {
            alert('请输入参数二维码的场景ID');
            return;
        }

        if(limit) {
            napi = 'http://'+ location.host +'/wx/qrticket?sceneid='+sid+'&limit=604800&access_token='+access_token;
        }else{
            napi = 'http://'+ location.host +'/wx/qrticket?sceneid='+sid+'&access_token='+access_token;
        }

		vge.ajxget(napi, 50000, function(r){
			qrimg.src=vxapi+r;
		},function(err){console.log(err);});
        
    });

})();
