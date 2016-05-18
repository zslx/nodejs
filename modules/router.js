// 根据 path 解析 controller + action + args
// controller + action === page
// protocl://host:port/c/p/arg1/arg2?param1=x&param2=y 两种传递参数方式
// 也可以手工 map 改变默认路由方式， 手工map的路由优先。
// 例如 http://xd.vjifen.com/web/clientlog/args?code=200&msg=testAutoRoute
// 等同于
// router.map({url:'/clog', controller:'web', action:'clientlog'});
// http://xd.vjifen.com/clog?code=200&msg=testAutoRoute
console.log('require load. module.id', module.id);

var ejsq = require('./ejsq'),
    routes={get:{},post:{},head:{},put:{},delete:{},},
    root='';

exports.setpath = function(path){
	root=path;
};

exports.map=map;
exports.route=route;
exports.xcall=xcall;

// 自动route规则
// protocl://host:port/c/p/arg1/arg2?param1=x&param2=y 两种传递参数方式
// c:Controller, p:PageAction
// 
// 注册route规则
// route.map({
//      method:'post',         // k1
//      url: '/blog/post',     // k2
//      controller: 'blog',    // v1
//      action: 'showBlogPost' // v2
//  })
function map(dict) {
	if(dict && dict.url && dict.controller)
	{
        var method = dict.method ? dict.method.toLowerCase() : 'get';
		var action = dict.action || 'index';

		routes[method][dict.url] = {c:dict.controller, a:action};
	}
}

function route(request,response,uri) {
    if(uri.path.substr(0,6)==='/clog?') { // 客户端日志
        // 用 websocket UDP 对比用http实现？ 同时在线的链接数限制
	    console.log('route-clog:',new Date().toLocaleString(),uri.query);
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end();
        return;
    }
    
	var method=request.method.toLowerCase(),
        ip='', tst='', ua = '',
	    pathname=uri.pathname;

    if(uri.path.search(/[?&]get[oO]penid=/)==-1 &&
       uri.path.search(/[&?]code=/)==-1 &&
       uri.path.search(/[?&]signature=/)==-1 &&
       uri.path.length>1
      ) {                       // 精简日志
        tst=new Date().toLocaleString();
        ip=request.headers['x-forwarded-for']||request.connection.remoteAddress;
        ua = request.headers['user-agent'];
	    console.log('time:%s IP:%s path:%s %s \nua:%s\n',tst,ip, method, uri.path, ua);
    }
    
    // 兼容 V积分APP 下载链接
    if(uri.search.indexOf('&page=download')!==-1) {
        response.writeHead(301, {
            'location':'http://m.vjifen.com/vjf/download?getopenid=1' 
        });
        response.end();
        return;
    }

	var ret='none';
	if(routes[method] && routes[method][pathname])
	{
        try{
		    var h=routes[method][pathname];
		    var controller=require(root+'/c/'+h.c);
		    ret=controller[h.a](request,response,uri);
        }catch(e){
            console.log('route err:',e);
		    response.writeHead(404, {"Content-type":"text/plain"});
		    response.write("404 not found");
		    response.end();
        }
	}else{
        ret = autoRoute(request,response,uri);
	}
	return ret;
}

function autoRoute(request,response,uri) {
    // '/c/p/a/b'
	var s = uri.pathname.substr(1); // 去掉第一个 /
	var ret='none';
    if(s.length > 0) {
        var parr = s.split('/');
        // console.log('autoRoute', parr);
        try{
	        if(parr.length>1) {
		        var controller=require(root+'/c/'+parr[0]),
                    action = controller[parr[1]];
	        }else if(parr.length===1){
		        var controller=require(root+'/c/'+parr[0]),
		            action = controller.index; // default action
            }else{
		        var controller=require(root+'/c/web'), // default controller:web
		            action = controller.index; // default action
            }
        }catch(e){
            console.log('autoRoute err:',e);
        }
    }
    // console.log('autoRoute',controller, action);
    // console.log('autoRoute',controller);
    if(controller && action){
		ret = action(request,response,uri);
    }else{
		console.log("No handler found for "+ uri.pathname);
        
		// response.writeHead(404, {"Content-type":"text/plain"});
		// response.write("404 not found");
		// response.end();
        ejsq.render('404.html',{msg:uri.pathname},request,response);
    }
    
	return ret;
}

function xcall(c,a,p) {
    // controller, action, parameters
    console.log('xcall debug', c,a,p);
    try{
	    var controller=require([root,c].join('/'));
    }catch(e){
        console.log('router.xcall errmsg',e);
    }
    if(controller!==undefined) {
        var action = controller[a];
        if(action!==undefined) {
		    // action(p);
            action.apply(controller, p); // 传递多个参数
        }else{
            console.log('router.xcall errmsg no action:',a);
        }
    }
}
