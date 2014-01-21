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
		
		//test basic operations
		chatClient.users();
		chatClient.status(userId);
		chatClient.online();
		chatClient.tape();
		chatClient.now();

		chatClient.unsubscribe('public.361fcfe8-6ef9-468c-9409-eef4858994ec', 'fallboy');
		chatClient.subscribelist();
		chatClient.subscribe('public.361fcfe8-6ef9-468c-9409-eef4858994ec', 'fallboy');
		chatClient.subscribelist();

		//test complex operations
		var createTestMessage = function() {
			var id = '5751465d-7d86-465a-bc02-9ae727ef2ac5';
			var content = 'test message with html <h1>Lenta12</h1>';
			var fromId = 'fallboy';
			var toId = 'test';
			var timestamp = Date.now();
			return chat.MessageFactory.create(id, content, fromId, toId, timestamp);
		};
		var testMessage = createTestMessage();

		chatClient.sendMessage(testMessage);
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
	chatClient.on('message:now', function(event) {
		console.log('now');
		console.log(event.response.now);
	});
	chatClient.on('message:subscribelist', function(event) {
		console.log('subscribelist');
		console.log(event.response.subscribelist);
	});
	chatClient.on('message:unknown', function(event) {
		console.log('unkonown');
		console.log(event.response);
	});
	
	chatClient.connect();
};