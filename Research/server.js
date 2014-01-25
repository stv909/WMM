var http = require('http');
var WebSocketServer = require('ws').Server;
var uuid = require('uuid');

var httpServer = http.createServer(function() {}); 
httpServer.listen(process.env.PORT, process.env.IP);
console.log(process.env.IP);
var webSocketServer = new WebSocketServer({ server: httpServer });

var clientsByUser = {};
webSocketServer.on('connection', function(socket) {

	var authResponse = {
		tag: 'authorize',
		authorize: {
			token: uuid.v4(),
			timestamp: Date.now()
		}
	};

	socket.on('message', function(data) {
		var request = JSON.parse(data);
		console.log(request.tag);
		switch (request.tag) {
			case 'authorize':
				authResponse.transactionId = request.transactionId;
				var authorize = request.authorize;
				var login = authorize.login;
				var token = authResponse.authorize.token;
				clientsByUser[login] = clientsByUser[login] || {};
				clientsByUser[login][token] = socket;
				socket.send(JSON.stringify(authResponse, null, 4));
				break;
			default:
				break;
		}
	})
});