'use strict';
console.log(`load once, module.id:${module.id}`);

const crypto = require('crypto'),
      assert = require('assert');

// init
const mode = 'aes-256-cbc',
      key = new Buffer(global.bizEKey+'=','base64'),
      iv = key.slice(0, 16);
// AES密钥： AESKey=Base64_Decode(EncodingAESKey + “=”)，EncodingAESKey尾部填充一个字符的“=”, 用Base64_Decode生成32个字节的AESKey
assert(key.length===32);

exports.decryptMsg = (secData)=>{
    // 消息加密解密
    // 检验消息的真实性，并且获取解密后的明文
	let plainMsg='';
    try {
        let decipher = crypto.Decipheriv(mode, key, iv);
        decipher.setAutoPadding(false);
        plainMsg= decipher.update(secData, 'base64','utf8') + decipher.final('utf8');
    } catch (e) {
        console.log(e.stack);
        return plainMsg;
    }
    var pad = plainMsg.lastIndexOf(global.bizAPPID);
    // console.log(`|${plainMsg}|`, pad);
    plainMsg = plainMsg.slice(20, pad);
    return plainMsg;
};

//将公众号回复用户的消息加密打包
// 加密的buf由16个字节的随机字符串、4个字节的msg_len(网络字节序)、msg和 Base64_Decode(EncodingAESKey + “=”) 32个字节
// msg_encrypt = Base64_Encode( AES_Encrypt[ random(16B) + msg_len(4B) + msg + ] )
exports.encryptMsg = (sReplyMsg, sTimeStamp, sNonce)=>{
    let sEncryptMsg='';
    let msgbuf = new Buffer(sReplyMsg),
        msglen=msgbuf.length, // 一个中文3Byte
        rs16 = crypto.randomBytes(8).toString('hex'),
        ml4 = htonl(msglen),
        pad = PKCS7(msglen+20+global.bizAPPID.length, key.length);
    
    let content = [rs16, ml4, msgbuf.toString('binary'), global.bizAPPID, pad].join('');
    console.log(`[${pad.length}]\n${content}`);
    try {
        console.log(`${mode},IV:${iv.length}:${iv}`);

        var cipher = crypto.createCipheriv(mode, key, iv);
        cipher.setAutoPadding(false);
        // 使用BASE64对加密后的字符串进行编码
        var crypted=cipher.update(content,'binary','base64')+ cipher.final('base64');
    } catch (e) {
        console.log(e);
        return '';
    }
    return sEncryptMsg;
};
    
function  htonl(len){
    var buf = new Buffer(4);
    buf.writeUInt32BE(len);
    console.log('enclen:', len, buf.toString('binary'));
    return buf.toString('binary');
}

function PKCS7(text_length, block_size){
    // 计算需要填充的位数
    var amount_to_pad = block_size - (text_length % block_size);
    if (amount_to_pad === 0) {
        amount_to_pad = block_size;
    }
    console.log('pad count < 32:', amount_to_pad);
    // 获得补位所用的字符
    var pad = String.fromCharCode(amount_to_pad), s = [];
    for (let i=0; i<amount_to_pad; i++) s.push(pad);

    let ret = s.join('');
    console.log(`pad:${amount_to_pad} |${pad}| ${s.length} ${ret.length}`);
    return ret;
}
