'use strict';
// 2016-05-11 12:01:00 下载
const args = process.argv;
// process.argv [ 'node', 'argv1my.js', 'argv2first', 'argv3second' ]
console.log('process.argv', args);
/* commands
   1 filename downdir
*/

global.fsroot = __dirname;
// 更新jsticket
const http = require('http'),
      fs = require('fs'),
      stream = require('stream');

const pre ='http://xiaoduzi.applinzi.com/yy/showImg.php?k=',
      keys =[
          '9.1393323168644.jpg',
          'day_201402252128102569.jpg',
          '9.1394721800217.png',
          '9.1413114512842.bmp',
          '99.1413118456183.jpeg',
          '98.1413561785714.gif',
          '98.1445134897488.webp',
          '9.1454588151338.jpg'];

console.log('keys length:',keys.length);

let wcnt = 0;
function download(n) {
    let key = keys[n],
        iurl = '';
    if(key.substr(0,4) === 'day_') {
        iurl = pre + key;
    }else{
        iurl = pre + 'origin' + key;
    }
    let fname = iurl.split('k=')[1];
    console.log(n, fname, iurl);
    
    http.get(iurl, (res)=>{
        console.log(`Got response: ${res.statusCode}`);
        var bufs = [], size=0;
        res.on('data', function(d) {
            // fs.write(fd, d, 0, d.length); // 异步，边读边写，顺序混乱
            bufs.push(d);
            size += d.length;
        });
        res.on('end', function() {
            let buf = Buffer.concat(bufs, size);
            // save2file(buf.toString('utf8'));
            console.log(`Got data: ${bufs.length}, ${size}`);

            // fs.open(fname, 'w', (err, fd) =>{
            //     console.log(`fs open ${err}`);
            //     if(err !== null ) return;
            //     fs.write(fd, buf, (err, written, string)=>{
            //         console.log(err, written);
            //         fs.close(fd);
            //         ++wcnt;
            //     });
            // });

            fs.writeFile(fname, buf, (err) => {
                ++wcnt;
                console.log(wcnt, err);
            });
            
        }).on('error', (e) => {
            console.log(`Got error: ${e.message}`);
        });
    });
}

let i=24, all = keys.length;
let timer = setInterval(()=>{
    download(i);
    ++i;
    if(i>=all) {
    // if(i>=30) {
        clearInterval(timer);
        timer=null;
    }
},2000);

// 等待异步写入完成
let timer2 = setInterval(()=>{
    console.log(`Write finished:${wcnt} of ${all - 24}`);
}, 3000);
