// 10.js JS程序级工具 vve:Vjifen VX Engine, Vjifen Game Engine
// 程序公共模块的规划： 这些源文件中只使用语言原生功能开发
// 1x 语言 框架  2x DOM 浏览器 3x Web  4x Game 5x node 6x ... 9x study
// 6x...8x 具体程序
(function(){
	var g = {
        // 生成namespace,并执行相应操作, 用于扩展模块功能
        register: function(ns, o) {
            var nsar = ns.split('.'),
			parent = window,i=0,l=nsar.length,part='';
            for (i=0; i<l; i++) {
				part=nsar[i];
                if(parent[part] === undefined) {
					parent[part] = {};
				}
                parent = parent[part];
            }
			// function o(vge){...} 扩展函数
            if (o) {
				// function.call(thisArg[,arg1[,arg2[,...]]]) 类似 apply
                o.call(parent, this);
            }
            return parent;
        },
		// 复制对象属性
		extend: function(destination, source, isCover) {
			(undefined === isCover) && (isCover = true);
			for (var name in source) {
				if (isCover || undefined === destination[name]) {
					// if(name==='getSpeedX') console.log(name,destination);
					destination[name] = source[name];
				}
			}
			return destination;
		}
	};
	// 暴露外部调用的对象 vge(Vjifen Game Engine)
	window.vge = g;
	g.h5ost = location.host; // 包含端口号
	// console.log('vge init',vge);
})();
