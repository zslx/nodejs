//加载html模块的方法
vge.register('vge', function(g) {
	var z = this;
    if(z.renderTpl === undefined) {
	    z.renderTpl = function(tpl, data) {
		    // 模板渲染函数
		    // 参数
		    // tpl： 模板， 字符串类型
		    // data:用于实例化模板的数据， json 对象
		    var k = '',
			    v = '',
                x,
			    r = tpl;
		    for (x in data) {
			    k = '\\[=' + x + '\\]';
			    r = r.replace(new RegExp(k, 'gi'), data[x]);
		    }
		    return r;
	    };
    }

	//android2.3 version or before 2.3 of resolvent not scroll
	z.androidResolvent = function(Did) {
		//拿到传来的div的id
		var elem, tx, ty;
		if ('ontouchstart' in document.documentElement) {
            if(z.isString(Did)) {
				elem = document.getElementById(Did);
			}else{
				elem = Did;
			}
			if (elem) {
				elem.style.overflow = 'hidden';
				elem.ontouchstart = start;
				elem.ontouchmove = move;
			}
		}

		function start(e) {
			var tch;
			if (e.touches.length == 1) {
				e.stopPropagation();
				tch = e.touches[0];
				tx = tch.pageX;
				ty = tch.pageY;
			}
		}

		function move(e) {
			var tch;
			if (e.touches.length == 1) {
				e.preventDefault();
				e.stopPropagation();
				tch = e.touches[0];
				this.scrollTop += ty - tch.pageY;
				ty = tch.pageY;
			}
		}
	};
	z.multipbox = function(msg, css, time, parent, tpl) {
		var boxId = 'tipbox_div',
			markid = 'tipbox_mark',
			box = document.getElementById(boxId),
			v,
			tipmark = document.getElementById(markid);
		if (box === null) {
			box = document.createElement('DIV');
			tipmark = document.createElement('DIV');
			v = box;
			v.setAttribute('id', boxId);
			tipmark.setAttribute('id', markid);
			tipmark.style.cssText = 'top: 0;left: 0,width:100%;height:100%;position:fixed;z-index:100000;background:#000000;filter: Alpha(opacity=50);opacity: 0.5';
			tipmark.addEventListener('click', function(e) {
				// bg 背景图层, 阻止其他点击操作
				e.stopPropagation();
				e.preventDefault();
				return false;
			}, false);
			// $(document).click(function(e){ $v.hide(); });
			v.addEventListener('click', function(e) {
				v.style.display = 'none';
				tipmark.style.display = 'none';
				switch (e.target.innerHTML){
				case '确定':
					alert('充值成功!');
					break;
				case '取消':
					break;	
				default:
					break;
				}
			}, false);

		} else {
			v = box;
		}
		if (parent === undefined) {
			if (document.body) {
				document.body.appendChild(box); // 不会重复创建
				document.body.appendChild(tipmark);
			} else {
				document.bodyElement.appendChild(box);
				document.bodyElement.appendChild(tipmark);
			}
		} else {
			parent.appendChild(box);
		}
		// position: absolute, relative 区别
		if (css !== undefined) {
			v.style.cssText = css;
		}
		if (tpl === undefined) {
			var ww = window.innerWidth,
				wh = window.innerHeight,
				tcss = 'width:82%;font-size:20px;top:50%;text-align:center;position:fixed;z-index:100001';
			// top:wh/2,
			// left:ww/2,
			v.style.cssText = tcss;
			var	pwh = (ww - v.offsetWidth) / 2;
			if (document.body.style.zoom!=='') {
				var Scale=document.body.style.zoom;
				pwh = (ww - v.offsetWidth*Scale) / 2/Scale;
			}

			if (z.tipbox.tpl === undefined) {
				// var tpl=vve.syncget(z.site.config.root+'/res/tipbox.html');
				z.tipbox.tpl = vge.syncget('/static/res/tipbox3.html');
			}
			v.innerHTML = z.renderTpl(z.tipbox.tpl, {
				'message': msg,
				'subtn': '确定',
				'canbtn': '取消',
				'title': ''
			});
			tipmark.style.display = 'block';
			v.style.display = 'block';
			v.style.paddingLeft = pwh + 'px'; //获取当前ID的宽度
		} else {
			v.innerHTML = z.renderTpl(tpl, {
				'message': msg
			});
			tipmark.style.display = 'block';
			v.style.display = 'block';
		}
		tipmark.style.display = 'block';
		v.style.display = 'block';
		if (time !== undefined) {
			if (z.tips_t !== null) {
				clearTimeout(z.tips_t);
				z.tips_t = null;
			}
			z.tips_t = setTimeout(function() {
				tipmark.style.display = 'none';
				v.style.display = 'none';
				clearTimeout(z.tips_t);
				z.tips_t = null;
			}, time);
		}
	};

	// msg 消息文本
	// css 顶层Div样式	
	z.tipbox = function tipboxD(msg, css, time, parent, tpl) {
		// tpl:
		// <div style="">
		//   <div style="">[=message]</div>
		//   <hr style="width:90%;color:gray">
		//   <a href="javascript:void(0)">确定</a>
		// </div>

		var boxId = 'tipbox_div',
			markid = 'tipbox_mark',
			box = document.getElementById(boxId),
			v,
			tipmark = document.getElementById(markid);
		if (box === null) {
			box = document.createElement('DIV');
			tipmark = document.createElement('DIV');
			v = box;
			v.setAttribute('id', boxId);
			tipmark.setAttribute('id', markid);
			tipmark.style.cssText = 'top: 0;left: 0,width:100%;height:100%;position:fixed;z-index:100000;background:#000000;filter: Alpha(opacity=50);opacity: 0.5';
			tipmark.addEventListener('click', function(e) {
				// bg 背景图层, 阻止其他点击操作
				e.stopPropagation();
				e.preventDefault();
				return false;
			}, false);
			// $(document).click(function(e){ $v.hide(); });
			v.addEventListener('click', function() {
				v.style.display = 'none';
				tipmark.style.display = 'none';
			}, false);

		} else {
			v = box;
		}

		if (parent === undefined) {
			if (document.body) {
				document.body.appendChild(box); // 不会重复创建
				document.body.appendChild(tipmark);
			} else {
				document.bodyElement.appendChild(box);
				document.bodyElement.appendChild(tipmark);
			}
		} else {
			parent.appendChild(box);
		}

		// position: absolute, relative 区别
		if (css !== undefined) {
			v.style.cssText = css;
		}

		if (tpl === undefined) {
			var ww = window.innerWidth,
				wh = window.innerHeight,
				tcss = 'width:82%;font-size:20px;top:50%;text-align:center;position:fixed;z-index:100001';
			// top:wh/2,
			// left:ww/2,
			v.style.cssText = tcss;
			var	pwh = (ww - v.offsetWidth) / 2;
			if (document.body.style.zoom!=='') {
				var Scale=document.body.style.zoom;
				pwh = (ww - v.offsetWidth*Scale) / 2/Scale;
			}

			if (z.tipbox.tpl === undefined) {
				// var tpl=vve.syncget(z.site.config.root+'/res/tipbox.html');
				z.tipbox.tpl = vge.syncget('/static/res/tipbox2.html');
			}
			v.innerHTML = z.renderTpl(z.tipbox.tpl, {
				'message': msg,
				'button': '我知道了',
				'title': ''
			});
			tipmark.style.display = 'block';
			v.style.display = 'block';
			v.style.paddingLeft = pwh + 'px'; //获取当前ID的宽度
		} else {
			v.innerHTML = z.renderTpl(tpl, {
				'message': msg
			});
			tipmark.style.display = 'block';
			v.style.display = 'block';
		}
		tipmark.style.display = 'block';
		v.style.display = 'block';
		if (time !== undefined) {
			if (z.tips_t !== null) {
				clearTimeout(z.tips_t);
				z.tips_t = null;
			}
			z.tips_t = setTimeout(function() {
				tipmark.style.display = 'none';
				v.style.display = 'none';
				clearTimeout(z.tips_t);
				z.tips_t = null;
			}, time);
		}
	};
	z.yyyymmdd = function(d) {
		var yyyy = d.getFullYear().toString(),
			mm = (d.getMonth() + 1).toString(), // getMonth() is zero-based
			dd = d.getDate().toString();
		return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]);
	};
	z.rimage = function(e) {
		if (e.tagName.toLowerCase() == 'img') {
			if (e.getAttribute('src0')) {
				e.setAttribute('src', e.getAttribute('src0'));
				e.removeAttribute('src0');
				// if(e.attr('height')==0){ e.removeAttr('height');}
			}
		} else {
			var eNodeList = e.querySelectorAll('img');
			for (var i = 0, len = eNodeList.length; i < len; i++) {
				if (eNodeList[i].getAttribute('src0')) {
					eNodeList[i].setAttribute('src', eNodeList[i].getAttribute('src0'));
					eNodeList[i].removeAttribute('src0');
					// if(e.attr('height')==0){ e.removeAttr('height');}
				}
			}
		}
	};
});
