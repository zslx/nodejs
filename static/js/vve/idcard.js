function getIdcardValidateCode(idds) {
    var weight=[7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2],
        validate = ['1','0','X','9','8','7','6','5','4','3','2'];
    var sum=0,mod=0,ymd=[];
    for(var i=0; i<17; ++i) {
        sum += parseInt(idds[i],10)*weight[i];
        if(i>5 && i<14) ymd.push(idds[i]);
    }
    mod = sum%11;
    // console.log(idds, ymd);
    // alert('idcard:'+validate[mod]);
    return validate[mod]===idds[17].toUpperCase();
}
