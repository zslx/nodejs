(function(){
    "use strict";
    var dom_nav = document.getElementsByTagName('nav'),
        dom_ul = dom_nav[0].getElementsByTagName('ul')[0],
        dom_li = dom_ul.children;

    dom_ul.addEventListener('click', function(ev){
        var ele = ev.target;
        if(ele.tagName.toLowerCase()==='li') {
            for(var l=dom_li.length,i=0; i<l; ++i) {
                dom_li[i].className='';
            }
            ele.className='active';
        }
    });
})();
