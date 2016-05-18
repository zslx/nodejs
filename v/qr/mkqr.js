$(function(){
	// 二维码生成

	var qrcode = new QRCode("qrcode", {
		text: "Welcome to Vjifen!",
		width: 128,
		height: 128,
		colorDark : "#000000",
		colorLight : "#ffffff",
		// correctLevel : QRCode.CorrectLevel.L
		correctLevel : QRCode.CorrectLevel.M
		// correctLevel : QRCode.CorrectLevel.Q
		// correctLevel : QRCode.CorrectLevel.H
	}), $qrstr=$('#qrstr'),$size=$('#qrsize'),
	canvas=document.getElementById('qrcode').childNodes[0];

	$('#qrbtn').click(function(ev){
		qrcode.clear();
		var level=QRCode.CorrectLevel.M,size=128;
		switch(document.forms['radiof']['qrlevel'].value) {
		case 'H':
			level=QRCode.CorrectLevel.H;
			break;
		case 'Q':
			level=QRCode.CorrectLevel.Q;
			break;
		case 'M':
			level=QRCode.CorrectLevel.M;
			break;
		case 'L':
			level=QRCode.CorrectLevel.L;
			break;
		}
		size = parseInt($size.val(),10);
		qrcode._htOption.correctLevel = level;
		qrcode._htOption.width = size;
		qrcode._htOption.height = size;
		canvas.width = size;
		canvas.height = size;
		qrcode.makeCode($qrstr.val());
	});

});
