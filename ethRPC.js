//this file handles the JSON-RPC requests to the eth client

var config = require('./config.js');
var http = require('http');


var getWork = function(cb){
	var callback = function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			var json = JSON.parse(str);
			cb(json);
		});
	}
	var req = http.request(config.ethServer, callback);
	//eth_getWork method
	req.write('{"jsonrpc":"2.0","method":"eth_getWork","params":[],"id":73}');
	req.end();
}

var blockNumber = function(cb){
	var callback = function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			var json = JSON.parse(str);
			cb(json);
		});
	}
	var req = http.request(config.ethServer, callback);
	//eth_getWork method
	req.write('{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":83}');
	req.end();
}

var submitWork = function(nonce, headerHash, mixDigest, cb){
	var message = {
		jsonrpc : "2.0",
		method : "eth_submitWork",
		params : [nonce, headerHash, mixDigest],
		id : 73
	};
	var callback = function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			var json = JSON.parse(str);
			cb(json);
		});
	}
	var req = http.request(config.ethServer, callback);
	req.write(JSON.stringify(message));
	req.end();

}

var sendTransaction = function(from, to, wei, cb){
	var txObject = {
		from : from,
		to : to,
		value : "0x"+wei.toString(16)
	};

	var message = {
		jsonrpc : "2.0",
		method : "eth_sendTransaction",
		params : [txObject],
		id : 1
	};

	var callback = function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			var json = JSON.parse(str);
			cb(json, to, wei);
		});
	}
	var req = http.request(config.ethServer, callback);
	req.write(JSON.stringify(message));
	req.end();
}

var getBalance = function(address, cb){
	var message = {
		jsonrpc : "2.0",
		method : "eth_getBalance",
		params: [
   			address,
   			'latest'
		],
		id : 1
	};
	var callback = function(response) {
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});
		response.on('end', function () {
			var json = JSON.parse(str);
			cb(json);
		});
	}
	var req = http.request(config.ethServer, callback);
	req.write(JSON.stringify(message));
	req.end();
}


module.exports = {
	getWork : getWork,
	blockNumber : blockNumber,
	submitWork : submitWork,
	sendTransaction : sendTransaction,
	getBalance : getBalance
}