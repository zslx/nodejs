'use strict';

const nodemailer = require('nodemailer');
const iconv = require('iconv-lite');

// const options = {
//     service: 'QQ',
//     auth: {
//         user: '249837746@qq.com',
//         pass: 'htjkegxjcbcc5' // 授权码
//     }
// };

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

exports.send = (from, to, subject, html, cb)=>{
    var mailBody = {
        // must be same as authorization
        from: 'zhshenglin@163.com',
        to: '249837746@qq.com',
        subject: 'Hello ✔',
        html: '<b>Hello world from Frand✔</b>' // 邮件正文
    };

    transporter.sendMail(mailBody, function(error, info) {
        if(error){
            console.log(iconv.decode(error.response, 'GBK'), error);
        }else{
            console.log('Message sent: ' + iconv.decode(info.response, 'GBK'));
        }
    });
};
