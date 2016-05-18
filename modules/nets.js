'use strict';
const net = require('net');
// 用json route {controller,action,data}
var cpath='';
exports.setpath = (path)=>{
    cpath = path;
};

const server = net.createServer((conn)=>{
    console.log('client connected');
    conn.on('end', ()=>{
        console.log('client disconnected');
    });
    conn.write('from node.net.server\r\n');
    // conn.pipe(conn);

    conn.on('data', (data)=>{
        try{                    // router
            let jo = JSON.parse(data.toString());
            console.log('server received:%j', jo);
            if(jo.c===undefined) jo.c='net';
            if(jo.a===undefined) jo.a='home';

            console.log('controller:',cpath + jo.c);
            let controller = require(cpath + jo.c);
            controller[jo.a](conn, jo);
        }catch(e){
            console.log('server received except:',data.toString(),e);
        }
    });
});

server.on('error', (err)=>{
    console.log('error:',err);
    throw err;
});

// nets = require('./nets'),
// nets.run({host:'localhost', port:8123}); // tcp

exports.run = (port)=>{
    // var options={host:'localhost', port:port};
    const options={port};
    server.listen(options, ()=>{console.log('server bound %j', server.address());});
}
