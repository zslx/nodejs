// DOM操作工具
vge.register('vge',function(g){
	this.audioPlayLoop=function(o){ // 循环播放音乐？未测
		vge.addHandler(o,'ended',function(){
			var t=setTimeout(function(){
				clearTimeout(t);
				t=null;
				o.play();
			},500);
			// console.log('play loop',o,t);
		});
		o.play();
	};

	this.playloop=function(o){
		o.autoplay='autoplay';
		o.loop='loop';
		o.play();
	};

	this.play=function(o){
		o.pause();
		o.currentTime=0;
		o.play();
	};

});
