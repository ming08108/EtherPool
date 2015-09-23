var http = require('http');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var shareHandler = require("./shareHandler.js");

app.use(bodyParser.json()); // for parsing application/json



app.post("/:address/:mh", function(req,res){
	if(req.body.method === "eth_getWork"){
		var mh = req.params.mh;
		var address = req.params.address;

		mh = (isNaN(parseInt(mh)) ? 1 : parseInt(mh));
		mh = Math.max(1, mh);
		mh = Math.min(mh, 9000);

		
		shareHandler.getWork(res, mh);
	}
	else if(req.body.method === "eth_submitWork"){
		var mh = req.params.mh;

		mh = (isNaN(parseInt(mh)) ? 1 : parseInt(mh));
		mh = Math.max(1, mh);
		mh = Math.min(mh, 9000);
		shareHandler.submitShare(req, res, mh);
	}
	else if(req.body.method === "eth_submitHashrate"){
		shareHandler.submitHashrate(req, res);
	}
	else {
		res.send("error");
	}
});


//start the mining server on port 5555
app.listen(5555);




