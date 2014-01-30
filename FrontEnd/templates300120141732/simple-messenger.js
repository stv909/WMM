window.onload = function() {
	
	//Imports
	var ChatClient = chat.ChatClient;
	var EventEmitter = chat.EventEmitter;
	
	var createTemplateElem = function(className) {
		var templatesElem = document.getElementById('templates');
		var templateElem = templatesElem.getElementsByClassName(className)[0];
		var newTemplateElem = templateElem.cloneNode('true');
		return newTemplateElem;
	};
	
	var updateStatusElem = function(textContent) {
		var statusElem = document.getElementById('status');
		statusElem.textContent = textContent;
	};
	
	var serverUrl = 'ws://www.bazelevscontent.net:9009/';
	var userId = 'fallboy';
	var chatClient = new ChatClient(serverUrl);
	
	var createLoginControlsElem = function() {
		var accountHolderElem = document.getElementById('account-holder');
		var loginControlsElem = createTemplateElem('login-controls');
		var loginButtonElem = loginControlsElem.getElementsByClassName('login-button')[0];
		var logoutButtonElem = loginControlsElem.getElementsByClassName('logout-button')[0];
		var userLoginElem = loginControlsElem.getElementsByClassName('user-login-input')[0];
		var greetingElem = loginControlsElem.getElementsByClassName('greeting')[0];
		
		loginButtonElem.addEventListener('click', function(event) {
			var login = userLoginElem.value;
			chatClient.connect();
			
			loginButtonElem.style.display = 'none';
			userLoginElem.style.display = 'none';
			greetingElem.style.display = 'none';
			greetingElem.textContent = '';
			logoutButtonElem.style.display = 'none';
			updateStatusElem('connecting...');
			
			var connectChatClientListener = function(event) {
				updateStatusElem('authorization...');
				
				chatClient.off('connect', connectChatClientListener);
				chatClient.on('message:login', loginChatClientListener);
				chatClient.login(login);
			};
			var loginChatClientListener = function(event) {
				console.log(event.response);
				updateStatusElem('online');

				chatClient.off('message:login', loginChatClientListener);
				chatClient.on('message:retrieve', retrieveChatClientListener);
				chatClient.on('message:users', usersChatClientListener);
				chatClient.retrieve(['profile', login].join('.'));
				chatClient.users();
				
				loginButtonElem.style.display = 'none';
				userLoginElem.style.display = 'none';
				greetingElem.style.display = '';
				greetingElem.textContent = event.response.login.message;
				logoutButtonElem.style.display = '';
			};
			var retrieveChatClientListener = function(event) {
				console.log(event.response.retrieve);
				chatClient.off('message:retrieve', retrieveChatClientListener);
			};
			var usersChatClientListener = function(event) {
				console.log(event.response.users);
				chatClient.off('message:users', usersChatClientListener);
			};
			var disconnectChatClient = function(event) {
				updateStatusElem('offline');
				
				chatClient.off();
				
				loginButtonElem.style.display = '';
				userLoginElem.style.display = '';
				greetingElem.style.display = 'none';
				greetingElem.textContent = '';
				logoutButtonElem.style.display = 'none';
			};
			
			chatClient.on('connect', connectChatClientListener);
			chatClient.on('disconnect', disconnectChatClient);
		});
		logoutButtonElem.addEventListener('click', function() {
			chatClient.disconnect();	
		});
		
		accountHolderElem.appendChild(loginControlsElem);
	};
	
	updateStatusElem('offline');
	createLoginControlsElem();
	
	var forceDisconnectButtonElem = document.getElementById('force-disconnect-button');
	forceDisconnectButtonElem.addEventListener('click', function() {
		chatClient.disconnect();	
	});
};