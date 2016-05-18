(function(env){
    "use strict";
    var plist = document.getElementById('favor-list'),
        bulletin = document.getElementById('bulletin'),
        morepost = document.getElementById('morepost'),
        pre = plist.firstChild,
        pcontainer = plist.parentNode;

    var securl = '', h1='jsdemo',h2='sinaapp',wapi='';
    
    morepost.setAttribute('data',30);

    var repbox = document.querySelector('.newpost'),rebtn,retxt;
    repbox = repbox.cloneNode(true); // true 复制子孙
    // repbox.removeChild(repbox.querySelector('.notice'));
    rebtn = repbox.querySelector('button');
    retxt = repbox.querySelector('textarea');
    retxt.setAttribute('placeholder', '留言');
    rebtn.id = 'replybtn';
    rebtn.innerHTML = '留 言';
    
    securl = [h1,h2,'com'].join('.');
    
    pcontainer.addEventListener('click', savepost);

    morepost.addEventListener('click', function(ev){
        var cur = parseInt(morepost.getAttribute('data'),10);
        morepost.setAttribute('data', cur+10);
        loadposts(cur,10);
    });
    
    plist.addEventListener('click', replypost);
    
    wapi = 'http://' + securl+ '/jsonp/';

    function loadwelcome(from,to){
        var url = wapi + '?welcome='+from + ','+to;
        nfc.ajxget(url, function(d){
            if(d!=='null' && d!==undefined) {
                var o = JSON.parse(d),l=o.length,i=0,html='';
                // ncf.isArray
                for(i=0;i<l;++i) {
                    html += '<pre>' + o[i].txt +'</pre>';
                }
                bulletin.innerHTML = html;
            }
            
        });
    }

    function loadposts(from,to){
        var url = wapi + '?msg='+from + ','+to;
        nfc.ajxget(url, function(d){
            if(d!=='null' && d!==undefined) {
                var o = JSON.parse(d),l=o.length,i=0, html='',pre2=null;
                // ncf.isArray
                if(l===0) return;
                
                for(i=0;i<l;++i) {
                    html += '<pre class="post" id="'+ o[i].id + '">'+ o[i].favor +'<span style="color:blue">~联系我:)</span><br><span></span><div class="reply"></div></pre>';
                }
                plist.innerHTML += html;
                
                // for(i=0;i<l;++i) {
                //     pre2 = pre.cloneNode();
                //     // pre2.setAttribute('id', o[i].id);
                //     pre2.id = o[i].id;
                //     pre2.innerHTML = o[i].favor;
                //     plist.appendChild(pre2);  // 没有成功？ 哪种方式更有效率
                // }
                
            }
        });
    }

    function loadreply(pp, from,to){
        var url = wapi + '?pid=' + pp.id + '&reply='+from + ','+to;
        nfc.ajxget(url, function(d){
            if(d!=='null' && d!==undefined) {
                var o = JSON.parse(d),l=o.length,i=0, html='',pre2=null;
                if(l===0) return;
                var replydiv = pp.querySelector('div');
                replydiv.innerHTML = '';
                for(i=0;i<l;++i) {
                    html += '<pre id="'+ o[i].pid + '-'+ o[i].id + '">' + o[i].favor +'</pre>';
                }
                replydiv.innerHTML += html;
            }
        });
    }

    function savepost(ev) {      // 发帖和回复
        var t = ev.target, ber=false;
        if(t.tagName==='BUTTON' &&
           t.className === 'mania') {
            var url = wapi +'?cmd=new',
                p = t.parentNode,
                h = p.querySelector('.hobby'),
                data = h.value;
            if(data.length <3) return;
            if(t.id === 'replybtn') {
                ber = true;
                url = wapi +'?cmd=reply&pid=' + t.getAttribute('data');
            }
            
            nfc.ajxpost(url, data, function(d) {
                if(d!=='null' && d!==undefined) {
                    var newp = document.createElement('pre');
                    newp.innerHTML = d;
                    if(plist.childNodes.length>0) {
                        if(ber) {
                            plist.insertBefore(newp, p);
                        }else{
                            plist.insertBefore(newp, plist.firstChild);
                        }
                    }else{
                        plist.appendChild(newp);
                    }
                }
            });
            h.value = '';       // 防止重复提交
        }
    }

    function replypost(ev) {
        var t = ev.target;
        if(t.tagName==='SPAN') t = t.parentNode;
        if(t.tagName!=='PRE' ||
           t.id === '') {
            return;
        }
        var p = t.parentNode;
        if(t.nextSibling===null) {
            p.appendChild(repbox);
        }else{
            p.insertBefore(repbox, t.nextSibling);
        }
        rebtn.setAttribute('data', t.id);
        // if( t.getAttribute('rcount') === null ) {
            // 获取回复数
            count_reply(t);
            loadreply(t, 0, 10);
        // }
    }

    function count_reply(pp){
        var url = wapi + '?rcount='+ pp.id;
        nfc.ajxget(url, function(d){
            // alert(d); [{"count":"0"}]
            var o = JSON.parse(d), c = parseInt(o[0].count,10);
            if(c > 0 ) {
                pp.setAttribute('rcount', c);
                pp.querySelector('span').innerHTML = '回复：' + c;
            }else{
                // pp.querySelector('span').innerHTML = '还没有回复，你来说两句吧:)';
            }
        });
    }

    
    loadwelcome(0,1);
    loadposts(0,30);

})(window);
