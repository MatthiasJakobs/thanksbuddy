var express = require('express')
var request = require('request')
var bodyParser = require('body-parser')
var cheerio = require('cheerio')
var config = require('./config')
var app = express()

var recipients = {}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
	res.send('Hello World!')
})

app.get('/webhook', function(req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === config.f_secret) {
			console.log("Validating webhook");
			res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);          
	}  
});


app.post("/webhook", function(req, res){
	var data = req.body;
	if (data.object === "page"){
		data.entry.forEach(function(entry){
			var pageID = entry.id;
			var timeOfEvent = entry.time;

			entry.messaging.forEach(function(event){
				if (event.message){
					receivedMessage(event);
				}
			});
	});

	res.sendStatus(200);

	}
});

function addItem(senderID, url){
	request(url, (err, response, body) => {
		if(err){
			console.error("error");
			return;
		}
		var $ = cheerio.load(body);

		// product name
		var name = $("#productTitle")
			.text()
			.replace(/\s+/g, " ")
			.replace(/\t+/g, "")
			.replace(/\n+/g, "")
			.substr(1)
			.slice(0,-1)
		
		// availability
		var available = $("#availability")
			.children()
			.text()
			.toLowerCase()
			.includes("auf lager")

		if(available){
			// price
			var price = parseFloat($("#price")
				.find($(".a-color-price"))
				.text()
				.match(/[0-9]+,[0-9]+/i)[0]
				.replace(",", "."))
		} else {
			var price = -1;
		}

		const infos = {name, url, price, available};

		if(recipients.senderId.products){
			products = recipients.senderId.products;
			var contains = false;
			products.forEach(product => {
				if(product.url === url){
					contains = true;
				}
			})
			if(!contains){
				recipients.senderId.products.push(infos);
			}
		} else {
			recipients.senderId.products = [infos];
		}
	});	
}

function receivedMessage(event){
	var message = event.message;
	var text = message.text;
	var senderId = event.sender.id;

	if(!recipients.senderId){
		recipients.senderId = {}
	}

	splits = text.split(" ");
	splits.forEach(element => {
		if(element.includes("amazon.de/")){
			sendMessage(senderId, "got it ;) ");
			addItem(senderId, element);			
		}
	})

	// Echo
	if(text){
		sendMessage(senderId, text);
	}
}

function sendMessage(id, text){
	var messageData = {
		recipient: {
			id: id
		}, 
		message: {
			text: text
		}
	};

	request(
		{
			uri: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: config.f_token },
			method: "POST",
			json: messageData
		}, function(err, res, body) {
			if (err){
				console.error("error while sending", err, res.statusCode);
			}
		}
	);

}

app.listen(process.env.PORT || 3000, function () {
	  console.log('Example app listening');
})


