var ethUtil = require('ethereumjs-util');
var ethRPC = require('./ethRPC.js');
var Ethash = require('ethashjs');
var fs = require('fs');
var redis = require('redis');
var BloomFilter = require('bloom-filter');

var config = require('./config.js');


const levelup = require('levelup');
const memdown = require('memdown');
const BN = require('bn.js');
 
var cacheDB = levelup('', {
  db: memdown
});
var ethash = new Ethash(cacheDB);

var numberOfElements = 100000;
var falsePositiveRate = 0.001;
var filter = BloomFilter.create(numberOfElements, falsePositiveRate);


var client = redis.createClient();
client.auth(config.redisPassword, redis.print);

var blockTarget;
var blockHeaderHash;



var verifyShare = function(nonce, headerHash, mixDigest, target, mh, address){
	ethRPC.blockNumber(function (json){
		var blockHex = json.result;
		var block = parseInt(blockHex, 16);
		console.log("block number (hex) " + blockHex);

		var bloomData = new Buffer(nonce + headerHash, "hex");
		ethash.loadEpoc(block, function(){
			var a = ethash.run(new Buffer(headerHash, 'hex'), new Buffer(nonce, 'hex'));
			var result = new BN(a.hash);
			//if the result is smaller than the target diff then its valid and we should save it to a db

			if(target.cmp(result) === 1 && blockHeaderHash.substring(2) === headerHash && !filter.contains(bloomData)){
				
				console.log("Valid Share");
				console.log("result " + result.toString(16));
				console.log("blockTarget " + blockTarget);
				console.log("address " + address);
				

				filter.insert(bloomData);

				//TODO test
				client.zadd("shares:" + address, new Date().getTime(), mh + ":" + nonce + ":" + headerHash, function(err, response){
					if(err){
						console.log(err);
					}
				});


				client.HINCRBY("totalRoundShares", address, mh, function(err, response){
					if(err){
						console.log(err);
					}
				});


				if(new BN(blockTarget.substring(2), 16).cmp(result) === 1){

					console.log("BLOCK FOUND!!!!!!!");

					ethRPC.submitWork("0x"+nonce, "0x"+headerHash, "0x"+mixDigest, function(response){
						console.log(response);
					});
					client.zadd("blocks", new Date().getTime(), block + ":" + nonce + ":" + headerHash + ":" + mixDigest, function(err, response){
						if(err){
							console.log(err);
						}
					});

				}
			}
			else{
				console.log("Invalid Share");
				console.log("result " + result.toString(16));

			}
		});
	});
}

var calculateTarget = function(mh){
	var targetSeconds = new BN(30);
	var h = new BN(mh).mul(new BN(1000000));
	var d = targetSeconds.mul(h);

	var target = ethUtil.TWO_POW256.div(d);
	return target.toString(16);
}


//TODO
//json.result[2] = "0x4796721ca09033bd0d1dc3106155dc7a549d5e09e80000000000000000"

module.exports = {
	getWork : function (res, mh) {
		ethRPC.getWork(function(json){
			blockTarget = json.result[2];
			blockHeaderHash = json.result[0];
			json.result[2] = calculateTarget(mh);
			res.send(json);
		});
	},
	
	submitShare : function (req, res, mh){
		//console.log("submitWork");

		var BNShareTarget = new BN(calculateTarget(req.params.mh), 16);
		var mh = mh;
		var address = req.params.address;

		var nonce = req.body.params[0].substring(2);
		var headerHash = req.body.params[1].substring(2);
		var mixDigest = req.body.params[2].substring(2);

		//console.log("nonce " + nonce + " headerHash " + headerHash + " mixDigest " + mixDigest);
		verifyShare(nonce, headerHash, mixDigest, BNShareTarget, mh, address);

		//send this to appease the mining client
		res.send('{"id": 1, "jsonrpc":"2.0", "result": true}');

	},

	submitHashrate : function(req, res){
		var mh = req.params.mh;
		var address = req.params.address;

		var hashrate = req.body.params[0]

		client.zadd("reportedHashrate", parseInt(hashrate.substring(2), 16), address, function(err, r){
			if(err){
				console.log(err)
			}
			res.send('{"id":73,"jsonrpc":"2.0","result": true}');
		});

		
	}
}
