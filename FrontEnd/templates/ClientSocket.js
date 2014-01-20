var ClientSocket = ClientSocket || {};

(function(ClientSocket) {
	
	var createClientSocket = function(serverUrl) {
		var chatClient = {
			socket: null,
			openCallbacks: [],
			closeCallbacks: [],
			messageCallbacks: [],
			errorCallbacks: []
		};
		
		var openHandler = function(event) {
			var openCallbacks = chatClient.openCallbacks;
			
			for (var i = 0; i < openCallbacks.length; i++) {
				var openCallback = openCallbacks[i];
				openCallback(event);
			}
		};
		var closeHandler = function(event) {
			var socket = chatClient.socket;
			var closeCallbacks = chatClient.closeCallbacks;
			
			for (var i = 0; i < closeCallbacks.length; i++) {
				var closeCallback = closeCallbacks[i];
				closeCallback(event);
			}

			socket.removeEventListener('open', openHandler);
			socket.removeEventListener('close', closeHandler);
			socket.removeEventListener('message', messageHandler);
			socket.removeEventListener('error', errorHandler);
			
			chatClient.openCallbacks = [];
			chatClient.closeCallbacks = [];
			chatClient.messageCallbacks = [];
			chatClient.errorCallbacks = [];
		};
		var messageHandler = function(event) {
			var messageCallbacks = chatClient.messageCallbacks;
			
			for (var i = 0; i < messageCallbacks.length; i++) {
				var messageCallback = messageCallbacks[i];
				messageCallback(event);
			}
		};
		var errorHandler = function(event) {
			var errorCallbacks = chatClient.errorCallbacks;
			
			for (var i = 0; i < errorCallbacks.length; i++) {
				var errorCallback = errorCallbacks[i];
				errorCallback(event);
			}
		};
		
		var socket = new WebSocket(serverUrl);
		
		chatClient.socket = socket;
		socket.addEventListener('open', openHandler);
		socket.addEventListener('close', closeHandler);
		socket.addEventListener('message', messageHandler);
		socket.addEventListener('error', errorHandler);
		
		return chatClient;
	};
	
	var closeClientSocket = function(clientSocket) {
		clientSocket.socket.close();	
	};
	
	var sendData = function(clientSocket, data) {
		clientSocket.socket.send(data);	
	};
	
	ClientSocket.create = createClientSocket;
	ClientSocket.close = closeClientSocket;
	ClientSocket.sendData = sendData;
	
})(ClientSocket);	