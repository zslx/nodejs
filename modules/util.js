// 通用工具类
var crypto = require('crypto');
exports.user_agent = user_agent;
exports.objempty = objempty;
exports.utf8clean = correct_non_utf_8;
exports.readline = readline;
exports.getrandom = getrandom;
exports.sha1 = sha1;


//sha1
function sha1(str) {
    var md5sum = crypto.createHash('sha1');
    md5sum.update(str, 'utf8');
    str = md5sum.digest('hex');
    return str;
}

// var md5 = crypto.createHash('md5');
// md5.update(v,'utf-8');
// md5.update('&key='+global.cashapikey, 'utf-8');
// return md5.digest('hex').toUpperCase();


// var platform = user_agent(req,/iphone/i)?200:user_agent(req,/android/i)?100:1000;
function user_agent(req, reg){
	var ua=req.headers['user-agent']||'';
	return ua.match(reg) === null;
}

function objempty(o) {
    for(var x in o) {
        return false;
    }
    return true;
}

// vbox=[[1.88,150], [8.8,50], [88,30], [108,5]] 放到配置和缓存，每次启动读取
function getrandom(vbox) {
    var l = vbox.length,
        i=parseInt(Math.random()*l),
        j=-1,
        r = -1,
        cnt = 0,
        g = vbox[i];
    
    if(g[1]>0) {
        r = g[0];
        g[1] -=1;
    }else{
        for(i=0;i<l;++i) {
            g = vbox[i];
            if(g[1]>0) {
                r = g[0];
                g[1] -=1;
                break;
            }
        }
    }
    return [r,i];
}
    

// Well-Formed UTF-8 Byte Sequences
// Code Points        First Byte Second Byte Third Byte Fourth Byte
// U+0000..U+007F     00..7F
// U+0080..U+07FF     C2..DF     80..BF
// U+0800..U+0FFF     E0         A0..BF      80..BF
// U+1000..U+CFFF     E1..EC     80..BF      80..BF
// U+D000..U+D7FF     ED         80..9F      80..BF
// U+E000..U+FFFF     EE..EF     80..BF      80..BF
// U+10000..U+3FFFF   F0         90..BF      80..BF     80..BF
// U+40000..U+FFFFF   F1..F3     80..BF      80..BF     80..BF
// U+100000..U+10FFFF F4         80..8F      80..BF     80..BF

// 剔除非 utf8 字符
function correct_non_utf_8(str) {
    var srcbuf = new Buffer(str),
        ls = srcbuf.length,
        le = 0, i =0,
        c = 0,c2=0,c3=0,c4=0,
        desbuf = new Buffer(ls*2);
        
    for(i=0; i<ls; ++i) {
        c = srcbuf.readUInt8(i);
        
        if(c<32){ // control char
            if(c===9 || c===10 || c===13){ // allow only \t \n \r
                desbuf.writeUInt8(c, le++);
            }
        }else if(c<127){// normal ASCII
            desbuf.writeUInt8(c, le++);
        }else if(c<160){//control char
            if(c2===128){//fix microsoft mess, add euro
                desbuf.writeUInt8(226, le++);
                desbuf.writeUInt8(130, le++);
                desbuf.writeUInt8(172, le++);
            }else if(c2===133){//fix IBM mess, add NEL = \n\r
                desbuf.writeUInt8(10, le++);
                desbuf.writeUInt8(13, le++);
            }
        }else if(c<192){//invalid for UTF8, converting ASCII
            desbuf.writeUInt8(194, le++);
            desbuf.writeUInt8(c, le++);
        }else if(c<194){//invalid for UTF8, converting ASCII
            desbuf.writeUInt8(195, le++);
            desbuf.writeUInt8(c-64, le++);
        }else if(c<224){//possibly 2byte UTF8
            c2=srcbuf.readUInt8(i+1);
            if(c2>127 && c2<192){//valid 2byte UTF8
                if(c===194 && c2<160){//control char, skipping
                }else{
                    desbuf.writeUInt8(c, le++);
                    desbuf.writeUInt8(c2, le++);
                }
                ++i;
            }else{//invalid UTF8, converting ASCII
                desbuf.writeUInt8(195, le++);
                desbuf.writeUInt8(c-64, le++);
            }
        }else if(c<240){//possibly 3byte UTF8
            c2=srcbuf.readUInt8(i+1);
            c3=srcbuf.readUInt8(i+2);
            if(c2>127 && c2<192 && c3>127 && c3<192){//valid 3byte UTF8
                desbuf.writeUInt8(c, le++);
                desbuf.writeUInt8(c2, le++);
                desbuf.writeUInt8(c3, le++);
                i+=2;
            }else{//invalid UTF8, converting ASCII
                desbuf.writeUInt8(195, le++);
                desbuf.writeUInt8(c-64, le++);
            }
        }else if(c<245){//possibly 4byte UTF8
            c2=srcbuf.readUInt8(i+1);
            c3=srcbuf.readUInt8(i+2);
            c4=srcbuf.readUInt8(i+3);
            if(c2>127 && c2<192 && c3>127 && c3<192 && c4>127 && c4<192){//valid 4byte UTF8
                desbuf.writeUInt8(c, le++);
                desbuf.writeUInt8(c2, le++);
                desbuf.writeUInt8(c3, le++);
                desbuf.writeUInt8(c4, le++);
                i+=3;
            }else{//invalid UTF8, converting ASCII
                desbuf.writeUInt8(195, le++);
                desbuf.writeUInt8(c-64, le++);
            }
        }else if(c<256){//invalid UTF8, converting ASCII
            desbuf.writeUInt8(195, le++);
            desbuf.writeUInt8(c-64, le++);
        }else{
            console.log('WTF? more than 256 values per Byte ?',c);
        }
    }
    srcbuf = null;
    return desbuf.slice(0,le).toString();
}

// test correct_non_utf_8
// 一次读入整个文件
// var fs = require('fs');
// var fname = 'errjson.txt';
// function readfile(fname) {
//     console.log('readfile',fname);
//     fs.exists(fname, function(exists) {
//         console.log(exists ? "it's there" : "no file!");
//         if(exists) {
//             fs.readFile(fname, 'utf8', function(err,data){
//                 if(err) {
//                     console.log('readFile:',err);
//                 }else{
//                     var da = data.split('\n'), l = da.length, s='',jo=null;
//                     for(var i=0;i<3;++i) {
//                         s = da[i];
//                         console.log(s.length, s);
//                         s = correct_non_utf_8(s);
//                         jo = JSON.parse(s);
//                         console.log(jo);
//                     }                                        
//                 }
//             });
//         }else{
//             console.log('readfile', exists, fname);
//         }
//     });
// }
// readfile(fname);

// 一次读入多行. 可以用流?
// readline(filepath, lineproc);
function readline(fname, cb) {
    // fs.readSync(fd, buffer, offset, length, position)
    // offset is the offset in the buffer to start writing at. 

    var fd = fs.openSync(fname, 'r'),
        pos = 0,
        rb = 0,
        lines = [],
        ll=0,i=0,l=0,
        total = 0,
        tmpn = 0,
        size = 4096,
        buffer = new Buffer(size);

    do{
        rb = fs.readSync(fd, buffer, 0, size, pos);
        delete lines;
        lines = [];
        if(rb < size) {             // file end
            if(rb > 0) {            // 最后一段
                lines = buffer.slice(0, rb).toString().split("\n")
            }
        }else{
            lines = buffer.slice(0, rb).toString().split("\n")
        }
        // console.log(buffer.slice(0, rb).toString());

        l = lines.length-1;
        total += l;
        ll=0;                   // 清空局部循环变量
        for(i=0; i<l; ++i) {
            ll += lines[i].length;
            ++ll;               // 包括换行符
            cb(lines[i]);
        }
        pos = pos + ll;
        if(++tmpn > 1000) {
            console.log('reads %d, linelen %d, pos %d, all %d', rb, ll, pos, total);
            tmpn=0;
        }
        if(rb < size) break;    // file end
    }while(true);

    fs.closeSync(fd);
}
