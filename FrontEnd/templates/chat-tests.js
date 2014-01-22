window.onload = function() {

	var serverUrl = 'ws://www.bazelevscontent.net:9009/';
	var userId = 'fallboy';
	var chatClient = new chat.ChatClient(serverUrl);
	
	chatClient.on('connect', function(event) {
		console.log('connect');
		chatClient.login(userId);
		
		//TODO: It seems not to be working.
		//chatClient.scrape();
	});
	chatClient.on('message:login', function(event) {
		console.log('message:login');
		console.log(event.response.login);
		
		var createTestMessage = function() {
			var id = '5751465d-7d86-465a-bc02-9ae727ef2ac5';
			var content = 'test spam message';
			var fromId = 'fallboy';
			var toId = 'test';
			var timestamp = Date.now();
			return chat.MessageFactory.create(id, content, fromId, toId, timestamp);
		};
		var testMessage = createTestMessage();
		
		var createTestTool = function() {
			var id = '5751465d-7d86-465b-bc02-9ae727ef2ac5';
			var content = '<h1>Test</h1>';
			var label = 'My Test Tool';
			return chat.ToolFactory.create(id, label, content);
		};
		var testTool = createTestTool();
		
		chatClient.users();
		chatClient.status(userId);
		chatClient.online();
		chatClient.tape();
		chatClient.now();
		chatClient.retrieve(['profile', 'stv909'].join('.'));
		chatClient.perlbox('stv909');

		chatClient.unsubscribe('public.361fcfe8-6ef9-468c-9409-eef4858994ec', 'fallboy');
		chatClient.subscribelist();
		chatClient.subscribe('public.361fcfe8-6ef9-468c-9409-eef4858994ec', 'fallboy');
		chatClient.subscribelist();
		
		chatClient.toolrepo();
		
		chatClient.publiclist();
		chatClient.groupuserlist('public.1562868b-a446-4a00-84c0-a39809574a2f');

		chatClient.sendMessage(testMessage);
		chatClient.broadcast(['msg', testMessage.id].join('.'));
		
		testMessage.to = 'fallboy';
		chatClient.notifyMessage(testMessage);
		
		chatClient.toolrepo();
		chatClient.saveTool(testTool);
		chatClient.toolrepo();
		chatClient.deleteTool(testTool.id);
		chatClient.toolrepo();
	});
	chatClient.on('message:scrape', function(event) {
		console.log('message:scrape');
		console.log(event.response.scrape);
	});
	chatClient.on('message:retrieve', function(event) {
		console.log('message:retrieve');
		console.log(event.response.retrieve);
	});
	chatClient.on('message:users', function(event) {
		console.log('message:users');
		console.log(event.response.users);
	});
	chatClient.on('message:perlbox', function(event) {
		console.log('message:perlbox');
		console.log(event.response.perlbox);
	});
	chatClient.on('message:broadcast', function(event) {
		console.log('message:broadcast');
		console.log(event.response.broadcast);
	});
	chatClient.on('message:status', function(event) {
		console.log('message:status');
		console.log(event.response.status);
	});
	chatClient.on('message:online', function(event) {
		console.log('message:online');
		console.log(event.response.online);
	});
	chatClient.on('message:tape', function(event) {
		console.log('message:tape');
		console.log(event.response.tape);
	});
	chatClient.on('message:notify', function(event) {
		console.log('message:notify');
		console.log(event.response.notify);
	});
	chatClient.on('message:send', function(event) {
		console.log('message:send');
		console.log(event.response.send);
	});
	chatClient.on('message:sent', function(event) {
		console.log('message:sent');
		console.log(event.response.sent);
	});
	chatClient.on('message:now', function(event) {
		console.log('message:now');
		console.log(event.response.now);
	});
	chatClient.on('message:subscribelist', function(event) {
		console.log('message:subscribelist');
		console.log(event.response.subscribelist);
	});
	chatClient.on('message:toolrepo', function(event) {
		console.log('message:toolrepo');
		console.log(event.response.toolrepo);
	});
	chatClient.on('message:publiclist', function(event) {
		console.log('message:publiclist');
		console.log(event.response.publiclist);
	});
	chatClient.on('message:groupuserlist', function(event) {
		console.log('message:groupuserlist');
		console.log(event.response.groupuserlist);
	});
	chatClient.on('message:unknown', function(event) {
		console.log('message:unkonown');
		console.log(event.response);
	});
	chatClient.on('disconnect', function(event) {
		console.log('disconnect');	
	});
	
	chatClient.connect();
};