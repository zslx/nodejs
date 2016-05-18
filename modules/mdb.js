/* BAE Node.js application */
var mysql = require('mysql');
// var pool = mysql.createPool(this.dboption);

var dboption = null, dbcli=null;

// var dboption = {
// 	host: process.env.BAE_ENV_ADDR_SQL_IP,
// 	port: process.env.BAE_ENV_ADDR_SQL_PORT,
// 	user: process.env.BAE_ENV_AK,
// 	password: process.env.BAE_ENV_SK,
// 	database:'thVinDrEAXDCkKqmpGWd'
// };

exports.setdb = setdb;
exports.getcon = getconnection;

function setdb(config) { dboption = config; }

function handleError(err) {
	if(err) {
		console.log(err);
		return;
	}
	console.log('connect ok.');
}

function reconnect (err) {
	if(err.code === 'PROTOCOL_CONNECTION_LOST') {
		dbcli = mysql.createConnection(dboption);
		dbcli.connect(handleError);
		dbcli.on('error', reconnect);
	}else{
		console.error(err.stack || err);
	}
}

function getconnection() {
	if(dbcli===null) {
		dbcli = mysql.createConnection(dboption);
		dbcli.connect(handleError);
		dbcli.on('error', function(err){ reconnect(err,dbcli);} );
	}
	return dbcli;
}
