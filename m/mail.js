'use strict';
const nodemailer = require('nodemailer');
const iconv = require('iconv-lite');

const options = {
    host: "smtp.163.com",
    secureConnection: true,
    port:465,
    auth: {
        user: 'zhshenglin@163.com',
        pass: 'htjkegxjcbcc5' // 授权码
    }
};

const transporter = nodemailer.createTransport(options);

exports.send = (to, subject, html, cb)=>{
    var mailBody = {
        from: 'zhshenglin@163.com', // must be same as authorization
        to,
        subject,
        html                    // 邮件正文
    };

    transporter.sendMail(mailBody, function(error, info) {
        if(error){
            // console.log(iconv.decode(error.response, 'GBK'), error);
            console.log(error);
        }else{
            console.log(`Message sent:${info.response}`);
        }
    });
};
