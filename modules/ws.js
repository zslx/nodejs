'use strict';
const crypto = require('crypto'),
      cryptojs = require("crypto-js"), // crypto-js 与 node-crypto 不兼容
      EventEmitter = require('events').EventEmitter;

var clientws = [];

// bizlogic 业务逻辑 路由 自动回复
let msgproc = (msg, ws)=>{
    console.log('收到消息：',msg);
    try{
        let jo = JSON.parse(msg);
        if(jo.c===undefined) jo.c='wsck';
        if(jo.a===undefined) jo.a='home';
        jo.c = [global.fsroot, jo.c].join('/c/');
        console.log('ws-msgproc:', jo.c);
        let controller = require(jo.c);
        controller[jo.a](ws, jo);
    }catch(e){
        console.log('msgproc catch:',e);
    }
};

// websocket简易封装
// 如何路由到不同的业务模块？
class WebSocket extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;
        this.state = 'OPEN';
        this.receiver = null;   // {Object} receiver 为decodeFrame返回的参数
        this.bind();
        this.heartBeat();
        
        clientws.push(this);
    }

    static wscount(){
        return clientws.length;
    }

    bind() {                    // 绑定事件处理
        var that = this;

        this.socket.on('error', (ev)=>{
            console.log('socket error',ev);
            try { that.destroy(); } catch (e) {}
        });
        
        this.socket.on('close', (ev)=>{
            console.log('socket close',ev);
            that.close(ev);
        });
        
        this.socket.on('data', (data)=>{
            that.dataHandle(data);
        });
    }

    close(reason) {
        // 关闭链接
        if (this.state === 'CLOSE') return;
        var index = clientws.indexOf(this);
        if (index!==-1) {
            clientws.splice(index, 1);
        }
        this.emit('close', reason);
        this.state = 'CLOSE';
        this.socket.destroy();

    }

    brocast(message) {
        // 广播信息
        console.log('brocast',clientws.length);
        clientws.forEach((ws)=>{
            ws.send(message);
        });
    }

    /**
     * 发送数据
     * @param  {String} message 发送的信息
     * @return {[type]}
     */
    send(message) {
        if (this.state !== "OPEN" && !this.socket.writable) return;
        this.socket.write(this.encodeFrame(message));
    }

    dataHandle(data) {          // socket有数据过来的处理
        var receiver = this.receiver;
        if (!receiver) {
            receiver = this.decodeFrame(data);
            if (receiver.opcode === 8) { // 关闭码
                console.log('opcode==8 client closed');
                this.close(new Error("client closed"));
                return;
            } else if (receiver.opcode === 9) { // ping码
                this.sendPong();
                return;
            } else if (receiver.opcode === 10) { // pong码
                this.pingTimes = 0;
                return;
            }
            this.receiver = receiver;
        } else {                // 将新来的数据跟此前的数据合并
            receiver.payloadData = Buffer.concat(
                [receiver.payloadData, data],
                receiver.payloadData.length + data.length
            );
            // 更新数据剩余数
            receiver.remains -= data.length;
        }
        // 如果无剩余数据，则将receiver置为空
        if (receiver.remains <= 0) {
            receiver = this.parseData(this.receiver);
            this.emit('message', receiver, this);
            this.receiver = null;
        }
    }

    heartBeat() {          // 心跳检测
        var that = this;
        var ping = ()=>{
            if (that.state !== "OPEN") return;
            // 如果连续3次未收到pong回应，则关闭连接
            if (that.pingTimes >= 3) {
                that.close("time out");
                return;
            }
            //记录心跳次数
            that.pingTimes++;
            that.sendPing();
            that.heartBeat();
        };
        setTimeout(ping, 20000);
    }

    sendPing() {
        this.socket.write(new Buffer(['0x89', '0x0']));
    }
    sendPong() {
        this.socket.write(new Buffer(['0x8A', '0x0']));
    }
    
    /*  The following is websocket data frame:
        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
        +-+-+-+-+-------+-+-------------+-------------------------------+
        |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
        |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
        |N|V|V|V|       |S|             |   (if payload len==126/127)   |
        | |1|2|3|       |K|             |                               |
        +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
        |     Extended payload length continued, if payload len == 127  |
        + - - - - - - - - - - - - - - - +-------------------------------+
        |                               |Masking-key, if MASK set to 1  |
        +-------------------------------+-------------------------------+
        | Masking-key (continued)       |          Payload Data         |
        +-------------------------------- - - - - - - - - - - - - - - - +
        :                     Payload Data continued ...                :
        + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
        |                     Payload Data continued ...                |
        +---------------------------------------------------------------+
    */

    /**
     * 对数据进行解码
     * @param  {Buffer} data 传过来的data
     * @return {Object}
     */
    decodeFrame(data) {
        var dataIndex = 2; //数据索引，因为第一个字节和第二个字节肯定不为数据，所以初始值为2
        var fin = data[0] >> 7; //获取fin位，因为是第一位，所以8位二进制往后推7位
        var opcode = data[0] & parseInt(1111, 2); //获取第一个字节的opcode位，与00001111进行与运算
        var masked = data[1] >> 7; //获取masked位，因为是第一位，所以8位二进制往后推7位
        var maskingKey,
            payloadData,
            remains = 0;

        //获取数据长度，与01111111进行与运算
        var payloadLength = data[1] & parseInt(1111111, 2);
        // 如果为126，则后面16位长的数据为数据长度，如果为127，则后面64位长的数据为数据长度
        if (payloadLength === 126) {
            dataIndex += 2;
            payloadLength = data.readUInt16BE(2);
        } else if (payloadLength === 127) {
            dataIndex += 8;
            // 32/8=4 4+2=6
            payloadLength = data.readUInt32BE(2) + data.readUInt32BE(6);
        }

        //如果有掩码，则获取32位的二进制masking key，同时更新index
        if (masked) {
            maskingKey = data.slice(dataIndex, dataIndex + 4);
            dataIndex += 4;
        }
        
        // 解析出来的数据
        payloadData = data.slice(dataIndex, dataIndex + payloadLength);

        // 剩余字节数
        remains = dataIndex + payloadLength - data.length;

        console.log({fin, opcode, masked, payloadLength, maskingKey, dataIndex, remains});

        return {
            fin,
            opcode,
            masked,
            maskingKey,
            remains,
            payloadData
        };
    }

    /**
     * 解析接收到的数据，如果有maskingKey则进行异或运算
     * @param  {Object} receiver 为decodeFrame返回的参数
     * @return {String} 解析后得到的数据
     */
    parseData(receiver) {
        var result;
        if (receiver.maskingKey) {
            result = new Buffer(receiver.payloadData.length);
            for (var i = 0; i < receiver.payloadData.length; i++) {
                //对每个字节进行异或运算，masked是4个字节，所以%4，借此循环
                result[i] = receiver.payloadData[i] ^ receiver.maskingKey[i % 4];
            }
        }
        result = (result || receiver.payloadData).toString();
        return result;
    }


    /**
     * 对要发送的数据进行编码
     * @param  {String} message 要发送的数据
     * @return {Buffer}
     */
    encodeFrame(message) {
        message = String(message);
        var length = Buffer.byteLength(message);
        if (!length) return null;
        //数据的起始位置，如果数据长度16位也无法描述，则用64位，即8字节，如果16位能描述则用2字节，否则用第二个字节描述
        var index = 2 + (length > 65535 ? 8 : (length > 125 ? 2 : 0));

        //定义buffer，长度为描述字节长度 + message长度
        var buffer = new Buffer(index + length);

        //第一个字节，fin位为1，opcode为1
        buffer[0] = 129;

        //因为是由服务端发至客户端，所以无需masked掩码
        if (length > 65535) {
            buffer[1] = 127;
            //长度超过65535由8个字节表示，4个字节能表达的长度为4294967295，将前面4个字节置0
            buffer.writeUInt32BE(0, 2);
            buffer.writeUInt32BE(length, 6);
        } else if (length > 125) {
            buffer[1] = 126;
            //长度超过125的话就由2个字节表示
            buffer.writeUInt16BE(length, 2);
        } else {
            buffer[1] = length;
        }

        //写入正文
        buffer.write(message, index);
        return buffer;
    }

    
}

// 握手
function onupgrade(req, sock, head){
    console.log('onupgrade ...');
    let errorHandler = (ev)=>{
        console.log('errorHandler', ev);
        try { sock.destroy(); } catch (e) {}
    };
    sock.on('error', errorHandler);
    
    let reqh = req.headers,
        connflg = reqh.connection.toLowerCase().split(', '),
        updflg = reqh.upgrade.toLowerCase();
    if(connflg.indexOf('upgrade')!==-1 && updflg==='websocket') {
        console.log(req.method,req.url,req.upgrade,req.headers, WebSocket.wscount());
        if(WebSocket.wscount() < 1000) {
            // signal upgrade complete
            handshake(req, sock, head);
            sock.removeListener('error', errorHandler);
        }else{
            abortConnection(sock, 400, 'Bad Request');
            console.log('websocket 链接数太多了');
        }
    }else{
        console.log('[%j]!==Upgrade|[%s]!==websocket',connflg, updflg);
        abortConnection(sock, 401, 'Bad Request');
    }
}

function abortConnection(socket, code, name) {
    // sock.end(); sock.close? sock.destroy?
    try {
        var response = [
            'HTTP/1.1 ' + code + ' ' + name,
            'Content-type: text/html'
        ];
        socket.write(response.concat('','').join('\r\n'));
    }catch (e) { /* ignore errors - we've aborted this connection */
        console.log('abortConnection err',e);
    }finally {
        // ensure that an early aborted connection is shut down completely
        try { socket.destroy(); } catch (e) {}
    }
}

function handshake(req,sock,head) {
    // ws-URI = "ws:" "//" host [ ":" port ] path [ "?" query ]
    // { host: 'xt.vjifen.com',
    // 'cache-control': 'no-cache',
    // pragma: 'no-cache',
    // origin: 'http://xt.vjifen.com',
    // 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36',
    // 'accept-encoding': 'gzip, deflate, sdch',
    // 'accept-language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
    // cookie: 'Hm_lvt_6d828a24f37c0e92ccab128a7d622ccb=1453079644',
    // connection: 'Upgrade',
    // upgrade: 'websocket',
    // 'sec-websocket-version': '13',
    // 'sec-websocket-key': '7ppl+LCqNorthVLdNFt4qg==',
    // 'sec-websocket-extensions': 'permessage-deflate; client_max_window_bits',
    // 'sec-websocket-protocol': 'protocolTxt, protocolBin' }

    var headers = [],reqh = req.headers, br = '\r\n',skey='',
        version = parseInt(reqh['sec-websocket-version']),
        ckey = reqh['sec-websocket-key'],
        protocols = reqh['sec-websocket-protocol'],
        extensions = reqh['sec-websocket-extensions'], // 忽略
        mask = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"; // ws协议规定的固定字符串

    if(!ckey) {
        abortConnection(sock, 402, 'Bad Request 2');
        return;
    }
    if (13 !== version) {
        abortConnection(socket, 403, 'Bad Request 3');
        return;
    }
    
    skey=crypto.createHash('sha1').update(ckey+mask).digest('base64');
    headers.push(
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Sec-Websocket-Accept:' + skey
    );
    if(protocols){headers.push('Sec-Websocket-Protocol:'+protocols.split(', ')[0]);}
    // if(extensions){headers.push('Sec-Websocket-Extensions:'+extensions);}

    sock.setTimeout(0);
    sock.setNoDelay(true);
    try {
        sock.write(headers.concat('', '').join(br));
        let wso=new WebSocket(sock);    // 是否需要传 req.method, req.url, req.headers
        // router
        wso.on('message', msgproc);
        // wso.brocast('有人加入');
    }catch (e) {
        // if the upgrade write fails, shut the connection down hard
        try { sock.destroy(); } catch (e) {}
        return;
    }
}


exports.WebSocket = WebSocket;
exports.onupgrade = onupgrade;

exports.broadcast = (message)=>{ // 广播信息
    console.log('broadcast:', clientws.length);
    clientws.forEach((ws)=>{
        ws.send(message);
    });
};
