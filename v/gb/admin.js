(function(env){
    "use strict";
    var plist = document.getElementById('favor-list'),
        bulletin = document.getElementById('bulletin'),
        pp = plist.parentNode;

    var del_btn = document.createElement('button');
    del_btn.innerHTML = 'delete';

    pp.addEventListener('click', savepost);
    plist.addEventListener('click', editpost);
    del_btn.addEventListener('click', delpost);

    function editpost(ev){
        var t = ev.target;
        if(t.tagName==='PRE' &&
           t.id !== '') {
            t.appendChild(del_btn);
        }
    }

    function delpost(ev){
        var t = ev.target;
        t = t.parentNode;
        if(confirm('确定要删除这条记录？')) {
            var url = 'http://jsdemo.sinaapp.com/jsonp/?cmd=del&id='+t.id;
            nfc.ajxpost(url, t.id, function(d){
                if(d!==undefined) {
                    plist.removeChild(t);
                }
            });
        }
    }
    
    function savepost(ev){
        var t = ev.target;
        if(t.tagName==='BUTTON' &&
           t.className === 'notice') {
            var url = 'http://jsdemo.sinaapp.com/jsonp/?cmd=inew',
                p = t.parentNode,
                h = p.querySelector('.hobby'),
                data = h.value;
            if(data.length <3) return;
            nfc.ajxpost(url, data, function(d){
                if(d!==undefined) {
                    var t = document.createElement('pre');
                    t.innerHTML = d;
                    bulletin.appendChild(t);
                }
            });
        }
    }

	// zslo.post('/web/del', o.id, function(r) {
	// 	o.parentNode.parentNode.removeChild(o.parentNode);
	// });

})(window);
