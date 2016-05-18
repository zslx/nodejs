'use strict';
const net = require('net'),
      EventEmitter = require('events').EventEmitter;

class NetC extends EventEmitter {
    constructor(options) {
        super();
        console.log('constructor ', options);
        this.options = options;
        this.trycnt = 0;
        this.conn = net.connect(options, ()=>{
            console.log('connected to server');
        });
        this.bind();
    }

    bind(){
        console.log('bind event handlers');
        var that = this;
        
        this.conn.on('error', (err)=>{
            console.log(`error:that.conn ${err}`);
            // throw err;
        });

        this.conn.on('end', ()=>{
            console.log('disconnected from server');
        });

        this.conn.on('data', (data)=>{
            console.log('from server:',data.toString());
            // that.conn.end();
            that.emit('data', data, that);
        });
    }

    send(msg) {
        if (!this.conn.writable) {
            console.log(`send error, no connect, reconnect ${this.trycnt}`);
            // return; 有条件重连？重试5次,次数能否达到溢出
            ++ this.trycnt;
            if(this.trycnt<5) {
                this.conn = net.connect(this.options, ()=>{
                    console.log('connected to server');
                    this.trycnt = 0;
                    this.conn.write(msg);
                });
                this.bind();
            }
            return;
        }
        this.conn.write(msg);
    }
}

exports.NetC = NetC;

// using
// var netc = new NetC({port:8123});
// netc.send('我是客户端测试消息');
