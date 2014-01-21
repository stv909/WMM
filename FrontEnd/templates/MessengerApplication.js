window.onload = function() {

	var serverUrl = 'ws://www.bazelevscontent.net:9009/';
	var userId = 'fallboy';
	var chatClient = new chat.ChatClient(serverUrl);
	
	chatClient.on('connect', function(event) {
		console.log('connect');
		chatClient.login(userId);
	});
	
	chatClient.on('message:login', function(event) {
		console.log('login');
		console.log(event.response.login);
		
		chatClient.users();
		chatClient.status(userId);
		chatClient.online();
		chatClient.tape();
		
		var msg = {
			id: '5751465d-7d86-465a-bc02-9ae727ef2ac5',
			from: 'fallboy', 
			to: 'test', 
			timestamp: 1390299905717,
			content: 'messageContent'
		};
		chatClient.sendMessage('5751465d-7d86-465a-bc02-9ae727ef2ac5', JSON.stringify(msg), 'test');
	});
	
	chatClient.on('message:users', function(event) {
		console.log('users');
		console.log(event.response.users);
	});
	chatClient.on('message:status', function(event) {
		console.log('status');
		console.log(event.response.status);
	});
	chatClient.on('message:online', function(event) {
		console.log('online');
		console.log(event.response.online);
	});
	chatClient.on('message:tape', function(event) {
		console.log('tape');
		console.log(event.response.tape);
	});
	chatClient.on('message:send', function(event) {
		console.log('send');
		console.log(event.response.send);
	});
	chatClient.on('message:sent', function(event) {
		console.log('sent');
		console.log(event.response.sent);
	});
	chatClient.on('message:unknown', function(event) {
		console.log('unkonown');
		console.log(event.response);
	});
	
	chatClient.connect();
};