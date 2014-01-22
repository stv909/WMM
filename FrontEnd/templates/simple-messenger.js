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
		
		loginButtonElem.addEventListener('click', function(event) {
			var login = userLoginElem.value;
			chatClient.connect();
			
			loginButtonElem.style.display = 'none';
			userLoginElem.style.display = 'none';
			logoutButtonElem.style.display = 'none';
			updateStatusElem('connecting...');
			
			var connectChatClientListener = function(event) {
				chatClient.login(login);
				updateStatusElem('authorization...');
			};
			var loginChatClientListener = function(event) {
				updateStatusElem('online');
				loginButtonElem.style.display = 'none';
				userLoginElem.style.display = 'none';
				logoutButtonElem.style.display = '';
			};
			var disconnectChatClient = function(event) {
				updateStatusElem('offline');
				loginButtonElem.style.display = '';
				userLoginElem.style.display = '';
				logoutButtonElem.style.display = 'none';
			};
			
			chatClient.on('connect', connectChatClientListener);
			chatClient.on('disconnect', disconnectChatClient);
			chatClient.on('message:login', loginChatClientListener);
		});
		logoutButtonElem.addEventListener('click', function() {
			chatClient.disconnect();	
		});
		
		accountHolderElem.appendChild(loginControlsElem);
	};
	
	updateStatusElem('offline');
	createLoginControlsElem();
};