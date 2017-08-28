var express = require('express')
var request = require('request')
var bodyParser = require('body-parser')
var app = express()

var token = "EAAW6LuoW808BAKcAMBukpJR7zoeZAi7Yd8PgsLQVci2kjQrPTn5dWM9Qxd618iGoQZBEMi4KL401qZAZC7wL6GMaNPqzVGuuMSkZABpKDGUCG2dG0GyDI8LgxVWv0ZAkbFPkUMbALyFvVQZBBpexbYqIVssYaqxBLzaRgqIdnim9QAEmWIc3tsK"

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
	res.send('Hello World!')
})

app.get('/webhook', function(req, res) {
	if (req.query['hub.mode'] === 'subscribe' &&
		req.query['hub.verify_token'] === "testthanks") {
			console.log("Validating webhook");
			res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);          
	}  
});


app.post("/webhook", function(req, res){
	var data = req.body;
	console.log(data);

	if (data.object === "page"){
		data.entry.forEach(function(entry){
			var pageID = entry.id;
			var timeOfEvent = entry.time;

			entry.messaging.forEach(function(event){
				if (event.message){
					receivedMessage(event);
				} else {
					console.log("unknown event", event);
				}
			});
	});

	res.sendStatus(200);

	}
});

function receivedMessage(event){
	var message = event.message;
	var text = message.text;
	var senderId = event.sender.id;

	console.log("message:", message);

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
			qs: { access_token: token },
			method: "POST",
			json: messageData
		}, function(err, res, body) {
			if (!err || res.statusCode != 200){
				console.error("error while sending");
			}
		}
	);

}

app.listen(process.env.PORT || 3000, function () {
	  console.log('Example app listening');
})


