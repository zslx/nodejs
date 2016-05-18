(function(env){
    if(env.nfc === undefined) {
        env.nfc = {};
    }
    var z = env.nfc;

    z.ajxget = function(url, callback){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
		    if (xhr.readyState === 4 && xhr.status === 200) {
			    callback(xhr.responseText);
			    xhr = null; // 释放内存
		    }
        };
	    xhr.open('GET', url, true);
        xhr.send();
    };

    z.ajxpost = function(url, data, callback){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
		    if (xhr.readyState === 4 && xhr.status === 200) {
			    callback(xhr.responseText);
			    xhr = null;
		    }
        };
        xhr.open('POST', url, true);
	    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	    xhr.send(data);
    };
    
})(window);
