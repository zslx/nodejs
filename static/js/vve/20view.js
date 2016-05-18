// window.innerWidth

vge.register('vge',function(g){
	this.do=function(fname, args){

        if(vge[fname]===undefined){
            search_load(fname, args);
        }else{
            vge[fname](args);
        }
	};

    function search_load(fname, args) {
        var doc = document,
            head= doc.head ||doc.getElementsByTagName("head")[0] ||doc.documentElement;

        var node = doc.createElement("script")
        node.async = true
        node.src = '/v/js/test.js'; // vge.flist[fname];

        head.appendChild(node);

        var supportOnload = "onload" in node;

        if (supportOnload) {
            node.onload = onload;
            node.onerror = function() {
                alert("error");
                onload(true);
            };
        } else {
            node.onreadystatechange = function() {
                if (/loaded|complete/.test(node.readyState)) {
                    onload();
                }
            };
        }

        function onload(error) {
            // Ensure only run once and handle memory leak in IE
            node.onload = node.onerror = node.onreadystatechange = null;
            // Remove the script to reduce memory leak
            head.removeChild(node);
            // Dereference the node
            node = null;

            // callback(error);
            vge[fname](args);
        }
    }
});
