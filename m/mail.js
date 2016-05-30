'use strict';

const nodemailer = require('nodemailer');
const iconv = require('iconv-lite');

const options = {
    service: 'QQ',
    auth: {
        user: 'qqmail@qq.com',
        // user: '249837746@qq.com',
        pass: 'lkuqhtjkegxjcbcc' // 授权码
    }
};

const transporter = nodemailer.createTransport(options);

exports.send = (from, to, subject, html)=>{
    var mailBody = {
        from: '120985785@qq.com ',             // 发送者邮箱, 必须输入邮件地址
        to: 'zhangliv@163.com',                  // 接收者邮箱, 可设置多个
        subject: 'Hello ✔',                     // 子标题
        html: '<b>Hello world from Frand✔</b>'  // 邮件正文
    };

    transporter.sendMail(mailBody, function(error, info) {
        if(error){
            console.log(iconv.decode(error.response, 'GBK'), error);
        }else{
            console.log('Message sent: ' + iconv.decode(info.response, 'GBK'));
        }
    });
};
