//Run this file to update the balances

var ethRPC = require('./ethRPC.js');
var redis = require('redis');

var config = require('./config.js');

var client = redis.createClient();
client.auth(config.redisPassword, redis.print);

var weiPerEther = 1000000000000000000;




ethRPC.getBalance(config.poolAddress, function(json){
	var balance = parseInt(json.result.substring(2), 16);
	console.log("wallet balance " + balance/weiPerEther);

	client.hgetall("totalRoundShares", function(err, roundShares){

		client.hgetall("balances", function(err, balances){


			var totalObligations = 0;
			for (var key in balances) {
				if (balances.hasOwnProperty(key)) {
					totalObligations = totalObligations + parseInt(balances[key]);
				}
			}

			balance = balance - totalObligations;
			console.log("Total payout: " + balance/weiPerEther);
			console.log("Total obligations: " + totalObligations/weiPerEther);

			if(balance <= 1 * weiPerEther){
				console.log("Nothing to add");
				process.exit();
			}

			var totalShares = 0;
			for (var key in roundShares) {
				if (roundShares.hasOwnProperty(key)) {
					totalShares = totalShares + parseInt(roundShares[key]);
				}
			}

			//loop though each user and add to their balance
			var totalPayout = 0;
			for (var key in roundShares) {
				if (roundShares.hasOwnProperty(key)) {
					var address = key;
					var percentage = (roundShares[key])/totalShares;

					var paymentWei = Math.floor(balance * percentage);
					totalPayout = totalPayout + paymentWei;

					client.hincrby("balances", address, paymentWei, function(err, response){
						if(!err){
							console.log("add balance: " + response);
						}
					});
					client.hdel("totalRoundShares", address, function(err, r){
						console.log(r);
					});

					console.log(address +" "+ paymentWei/weiPerEther);
				}
			}
			console.log("done");
		});
		//sum up the total round shares
	});
});
