import redis
import json
import requests
import time

r = redis.StrictRedis(password="p4o2346tatogra234ssele355phantgesfrjn")
ethToWei = 1000000000000000000


def sendTx(fromAddr, to, wei):
	url = "http://localhost:8079"
	headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
	txObject = {"from" : fromAddr, "to" : to, "value" : hex( int(wei) - int((0.01 * ethToWei)) )}
	message = {"jsonrpc" : "2.0", "method" : "eth_sendTransaction", "params" : [txObject], "id" : 1}

	response = requests.post(url,headers=headers, json=message)
	print response.text
	a = json.loads(response.text)
	return a["result"]

def waitForTx(txId):
	message = {"jsonrpc" : "2.0", "method" : "eth_getTransactionReceipt", "params" : [txId], "id" : 1}
	headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
	url = "http://localhost:8079"
	done = False
	while(not done):
		print "waiting for tx recept "
		time.sleep(3)
		response = requests.post(url,headers=headers, json=message)
		a = json.loads(response.text)
		if(a['result'] is not None):
			done = True


	

r.set("lastpayout", int(round(time.time() * 1000)))

myAddress = "0xd1e56c2e765180aa0371928fd4d1e41fbcda34d4"
balances = r.hgetall("balances")

for address, value in balances.iteritems():


	if(int(value) > 0.2 * ethToWei and len(address) == 42):
		txId = sendTx(myAddress, address, value)
		print "sent " + str(int(value)/1000000000000000000.) + " to " + address

		waitForTx(txId)

		r.zadd("payments:" + address, int(round(time.time() * 1000)), value)
		r.hdel("balances", address)
	else:
		print "Too low or bad address " + address + " " + str(int(value)/1000000000000000000.)
