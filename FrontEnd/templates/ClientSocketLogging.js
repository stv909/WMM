var ClientSocketLogging = ClientSocketLogging || {};

(function(ClientSocketLogging) {

	var openCallback = function(event) {
		console.log('socket is open');
	};
	var messageCallback = function(event) {
		console.log('socket received a message');
		console.log(event.data);
	};
	var errorCallback = function(event) {
		console.log('socket error occurred');
		console.log(event);
	};
	var closeCallback = function(event) {
		console.log('socket is closed');
	};
	
	ClientSocketLogging.openCallback = openCallback;
	ClientSocketLogging.messageCallback = messageCallback;
	ClientSocketLogging.errorCallback = errorCallback;
	ClientSocketLogging.closeCallback = closeCallback;

})(ClientSocketLogging);