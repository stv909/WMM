window.onload = function() {

	var Event = utils.Event;
	
	var ChatClient = function(serverUrl) {
		Event.call(this);
		
		this.serverUrl = serverUrl;
		this.socket = null;
	};
	
	ChatClient.prototype = Object.create(Event.prototype);
	
	ChatClient.prototype.constructor = ChatClient;
	
	ChatClient.prototype.connect = function() {
		var self = this;
		
		var openSocketListener = function(event) {
			self.trigger({
				type: 'connect',
				target: self,
				socketEvent: event
			});
		};
		var closeSocketListener = function(event) {
			self.trigger({
				type: 'disconnect',
				target: self,
				socketEvent: event
			});
			
			self.socket.removeEventListener('open', openSocketListener);
			self.socket.removeEventListener('close', closeSocketListener);
			self.socket.removeEventListener('message', messageSocketListener);
			self.socket.removeEventListener('close', closeSocketListener);
		};
		var messageSocketListener = function(event) {
			self.trigger({
				type: 'message',
				target: self,
				socketEvent: event
			});
			
			var response = JSON.parse(event.data);
			var type = 'message:unknown';
			
			if (response.login) {
				type = 'message:login';
			}
			else if (response.users) {
				type = 'message:users';
			}
			
			self.trigger({
				type: 'message:login',
				target: type,
				response: response,
				socketEvent: event
			});
		};
		var errorSocketListener = function(event) {
			self.trigger({
				type: 'error',
				target: self,
				socketEvent: event
			});
		};
		
		this.socket = new WebSocket(this.serverUrl);
		
		this.socket.addEventListener('open', openSocketListener);
		this.socket.addEventListener('close', closeSocketListener);
		this.socket.addEventListener('message', messageSocketListener);
		this.socket.addEventListener('error', errorSocketListener);
	};
	
	var serverUrl = 'ws://www.bazelevscontent.net:9009/';
	var userId = 'fallboy';
	var chatClient = new ChatClient(serverUrl);
	
	var connectListener = function(event) {
		var socketEvent = event.socketEvent;
		var socket = socketEvent.srcElement;
		
		socket.send('login');
		socket.send(userId);
		
		chatClient.off('connect', connectListener);
	};
	var messageListener = function(event) {
		console.log(event);
	};
	var messageLoginListener = function(event) {
		console.log('login complete');
	};
	var messageUsersListener = function(event) {
		console.log('users message');	
	};
	var messageUnknownListener = function(event) {
		alert(event);	
	};
	
	chatClient.on('connect', connectListener);
	chatClient.on('message', messageListener);
	chatClient.on('message:login', messageLoginListener);
	chatClient.on('message:unknown', messageUnknownListener);
	
	chatClient.connect();
	
	// var createChatClientFunc = function(serverUrl, userId, prepareClientSocketCallback) {
	// 	prepareClientSocketCallback = prepareClientSocketCallback || Empty.function;
	// 	var createChatClientCallback = function() {
	// 		var clientSocket = ClientSocket.create(serverUrl);
	// 		var chatLoginCallback = loginUserFunc(userId);
	// 		var clientSocketLoggingCallback = clientSocketLoggingFunc(false);
			
	// 		clientSocket.openCallbacks.push(chatLoginCallback);
	// 		clientSocketLoggingCallback(clientSocket);
	// 		prepareClientSocketCallback(clientSocket);
	// 	};
	// 	return createChatClientCallback;
	// };
	
	// var clientSocketLoggingFunc = function(isEnable) {
	// 	var clientSocketLoggingCallback = function(clientSocket) {
	// 		if (isEnable) {
	// 			clientSocket.openCallbacks.push(ClientSocketLogging.openCallback);
	// 			clientSocket.messageCallbacks.push(ClientSocketLogging.messageCallback);
	// 			clientSocket.errorCallbacks.push(ClientSocketLogging.errorCallback);
	// 			clientSocket.closeCallbacks.push(ClientSocketLogging.closeCallback);
	// 		}
	// 	};
	// 	return clientSocketLoggingCallback;
	// };
	
	// var loginUserFunc = function(userId) {
	// 	var chatLoginCallback = function(event) {
	// 		var socket = event.srcElement;
	// 		socket.send('login');
	// 		socket.send(userId);
	// 	};	
	// 	return chatLoginCallback;
	// };
	
	// var prepareClientSocketFunc = function(parseMessageCallback) {
	// 	parseMessageCallback = parseMessageCallback || Empty.function;
	// 	var prepareClientSocketCallback = function(clientSocket) {
	// 		clientSocket.messageCallbacks.push(parseMessageCallback);
	// 	};
	// 	return prepareClientSocketCallback;
	// };
	
	// var parseMessageFunc = function(processResponseCallback) {
	// 	processResponseCallback = processResponseCallback || Empty.function;
	// 	var parseMessageCallback = function(event) {
	// 		try {
	// 			var data = event.data;
	// 			var response = JSON.parse(data);
	// 			processResponseCallback(response);
	// 		} catch (e) {
	// 			console.log('failed parse a received message');
	//  			console.log(e);
	// 		}
	// 	};
	// 	return parseMessageCallback;
	// };
	
	// var procesmsResponseFunc = function(responseHandlers) {
	// 	responseHandlers = responseHandlers || Empty.object;
	// 	var processResponseCallback = function(response) {
	// 		var responseHandler = Empty.function;
	// 		if (response.login) {
	// 			responseHandler = responseHandlers.login || Empty.function;
	// 		}
	// 		else if (response.users) {
	// 			responseHandler = responseHandlers.users || Empty.function;
	// 		}
	// 		else if (response.error) {
	// 			responseHandler = responseHandlers.error || Empty.function;
	// 		}
	// 		responseHandler(response);
	// 	};
	// 	return processResponseCallback;
	// };
	
	// var responseHandlers = {
	// 	login: function(response) {
	// 		alert(JSON.stringify(response, null, 4));
	// 	},
	// 	users: function(response) {
	// 		console.log('users message');
	// 	},
	// 	tape: function(response) {
	// 		console.log('tape message');
	// 	},
	// 	online: function(response) {
	// 		console.log('online message');
	// 	},
	// 	sent: function(response) {
	// 		console.log('sent message');
	// 	},
	// 	send: function(response) {
	// 		console.log('send message');
	// 	},
	// 	retrieve: function(response) {
	// 		console.log('retrieve message');
	// 	},
	// 	error: function(response) {
	// 		alert(JSON.stringify(response, null, 4));	
	// 	}
	// };
	// var processResponseCallback = processResponseFunc(responseHandlers);
	// var parseMessageCallback = parseMessageFunc(processResponseCallback);
	// var prepareClientSocketCallback = prepareClientSocketFunc(parseMessageCallback);
	// var serverUrl = 'ws://www.bazelevscontent.net:9009/';
	
	// var loginElem = document.getElementById('login');
	// var userIdElem = document.getElementById('userId');
	// loginElem.addEventListener('click', function() {
	// 	var userId = userIdElem.value;
	// 	var createChatClientCallback = createChatClientFunc(serverUrl, userId, prepareClientSocketCallback);
	// 	createChatClientCallback();
	// });
};