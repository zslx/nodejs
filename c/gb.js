var ejsq = require('../modules/ejsq');

exports.index = defaultAction;

function defaultAction(req, res, uri) {
    var tpl='gb/index.html',
        sec = '',
        d = new Date(),
        s = '',
        data={admin:false};

    sec = d.getUTCDate() + '';
    if(sec.length===2) {
        s = (parseInt(sec.substr(1),10) + parseInt(sec.substr(0,1),10)) + '';
        sec = sec + s.substr(0,1);
    }else{
        sec = sec+'9';
    }
    
    if(uri.query.sec === sec) {
        data.admin=true;
    }
    ejsq.render(tpl, data, req, res);
}
