vge.register('vge', function(g) {
	var z = this;
	if (['duzixf.applinzi.com', ':5050', ':5050'].indexOf(location.host) !== -1) { // online
 		z.iport = 80;
		z.ihost = 'i.x.com';
		z.imgsrv = 'img.x.com:8000';
	} else {
	}
});
