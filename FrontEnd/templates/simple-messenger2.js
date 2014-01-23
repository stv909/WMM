window.onload = function() {
	
	var EventEmitter = chat.EventEmitter;
	var ChatClient = chat.ChatClient;
	
	var createTemplateElem = function(className) {
		var templatesElem = document.getElementById('template');
		var templateElem = templatesElem.getElementsByClassName(className)[0];
		var newTemplateElem = templateElem.cloneNode(true);
		return newTemplateElem;
	};
	
	var ChatApplication = function() {
		var self = this;
		
		var serverUrl = 'ws://www.bazelevscontent.net:9009/';
		var chatClient = new ChatClient(serverUrl);
		
		var menuElem = document.getElementById('menu');
		var contactsElem = document.getElementById('contacts');
		
		var userId = null;
		var contactsMap = {};
		var publicMap = {};

		var initializeAccountElem = function() {
			var accountElem = createTemplateElem('account');
			
			var loginControlsElem = accountElem.getElementsByClassName('login-controls')[0];
			var logoutControlsElem = accountElem.getElementsByClassName('logout-controls')[0];

			var loginInputElem = accountElem.getElementsByClassName('login-input')[0];
			var loginButtonElem = accountElem.getElementsByClassName('login-button')[0];
			var cancelLoginButtonElem = accountElem.getElementsByClassName('cancel-login-button')[0];
			
			var nameElem = accountElem.getElementsByClassName('name')[0];
			var avatarImg = (accountElem.getElementsByClassName('avatar')[0]).getElementsByTagName('img')[0];
			var logoutButtonElem = accountElem.getElementsByClassName('logout-button')[0];
			
			var statusElem = accountElem.getElementsByClassName('status')[0];
			
			loginControlsElem.classList.remove('hidden');
			logoutControlsElem.classList.add('hidden');
			
			statusElem.classList.add('hidden');
			cancelLoginButtonElem.classList.add('hidden');
			
			loginInputElem.addEventListener('keydown', function() {
				if (event.keyCode === 13) {
					loginButtonElem.click();
					loginInputElem.blur();
				}
			});
			loginButtonElem.addEventListener('click', function() {
				var userId = loginInputElem.value;
				chatClient.connect();
				
				statusElem.textContent = 'Connecting ...';
				
				statusElem.classList.remove('hidden');
				cancelLoginButtonElem.classList.remove('hidden');
				
				loginInputElem.classList.add('hidden');
				loginButtonElem.classList.add('hidden');
				
				var connectChatClientListener = function(event) {
					statusElem.textContent = 'Authorizating ...';
					
					chatClient.off('connect', connectChatClientListener);
					chatClient.on('message:login', loginChatClientListener);
					chatClient.login(userId);
				};
				var loginChatClientListener = function(event) {
					loginControlsElem.classList.add('hidden');
					logoutControlsElem.classList.remove('hidden');
					
					chatClient.off('message:login', loginChatClientListener);
					chatClient.on('message:retrieve', retrieveChatClientListener);
					chatClient.retrieve(['profile', userId].join('.'));
				};
				var retrieveChatClientListener = function(event) {
					chatClient.off('message:retrieve', retrieveChatClientListener);

					var profile = event.response.retrieve[0];
					var profileId = profile.id.replace('profile.', '');

					if (userId === profileId) {
						var profileValue = profile.value || {};
						avatarImg.src = profileValue.avatar || 'http://simpleicon.com/wp-content/uploads/business-man-1.png';
						nameElem.textContent = profileValue.nickname || userId;
					}
					
					self.trigger({
						type: 'authorize',
						userId: userId
					});
				};
				var disconnectChatClientListener = function(event) {
					chatClient.off();
					
					loginControlsElem.classList.remove('hidden');
					logoutControlsElem.classList.add('hidden');
					
					statusElem.classList.add('hidden');
					cancelLoginButtonElem.classList.add('hidden');
					
					loginInputElem.classList.remove('hidden');
					loginButtonElem.classList.remove('hidden');
					
					avatarImg.src = 'http://www.dangerouscreation.com/wp-content/uploads/2012/11/blank_avatar.jpg';
					nameElem.textContent = "";
					
					self.trigger({
						type: 'disconnect'	
					});
				};
				
				chatClient.on('connect', connectChatClientListener);
				chatClient.on('disconnect', disconnectChatClientListener);
			});
			logoutButtonElem.addEventListener('click', function(event) {
				chatClient.disconnect();
			});
			cancelLoginButtonElem.addEventListener('click', function(event) {
				chatClient.disconnect();
			});

			menuElem.appendChild(accountElem);
		};
		
		var createContact = function(profile) {
			var wrapElem = contactsElem.getElementsByClassName('wrap')[0];
			var listElem = wrapElem.getElementsByClassName('list')[0];
			
			var newContactElem = createTemplateElem('contact');
			var avatarImageElem = newContactElem.getElementsByClassName('avatar-image')[0];
			var nameTextElem = newContactElem.getElementsByClassName('name-text')[0];

			var id = profile.id.replace('profile.', '');
			var profileValue = profile.value || {};
			var nickname = profileValue.nickname || id;
			var avatarSrc = profileValue.avatar || 'http://simpleicon.com/wp-content/uploads/business-man-1.png';
			
			newContactElem.title = id;
			avatarImageElem.src = avatarSrc;
			nameTextElem.textContent = nickname;

			newContactElem.addEventListener('click', function() {
				self.trigger({
					type: 'select:contact',
					contactId: id
				});
			});
			
			contactsMap[profile.id] = newContactElem;
			listElem.appendChild(newContactElem);
		};
		var createContactList = function(profiles) {
			profiles.forEach(createContact);	
		};
		var deleteContact = function(profileId) {
			var contactElem = contactsMap[profileId];
			var wrapElem = contactsElem.getElementsByClassName('wrap')[0];
			var listElem = wrapElem.getElementsByClassName('list')[0];
			
			delete contactsMap[profileId];
			listElem.removeChild(contactElem);
		};
		var deleteAllContacts = function() {
			var profileIds = Object.keys(contactsMap);
			profileIds.forEach(deleteContact);
		};
		
		var createPublic = function(publicDetail) {
			var wrapElem = contactsElem.getElementsByClassName('wrap')[0];
			var listElem = wrapElem.getElementsByClassName('list')[0];
			
			var newPublicElem = createTemplateElem('public');
			var avatarImageElem = newPublicElem.getElementsByClassName('avatar-image')[0];
			var nameTextElem = newPublicElem.getElementsByClassName('name-text')[0];
			
			var publicValue = publicDetail.value;
			
			if (publicValue) {
				newPublicElem.title = publicValue.id;
				nameTextElem.textContent = '[' + publicValue.label + ']';
				avatarImageElem.src = 'https://cdn3.iconfinder.com/data/icons/linecons-free-vector-icons-pack/32/world-512.png';
				//"http://simpleicon.com/wp-content/uploads/group-1.png";
				
				newPublicElem.addEventListener('click', function() {
					self.trigger({
						type: 'select:public',
						publicId: publicValue.id
					});
				});
				
				publicMap[publicDetail.id] = newPublicElem;
				listElem.appendChild(newPublicElem);
			}
		};
		var createPublicList = function(publicDetails) {
			publicDetails.forEach(function(publicDetail) {
				createPublic(publicDetail);
			});
		};
		var deletePublic = function(publicId) {
			var publicElem = publicMap[publicId];
			var wrapElem = contactsElem.getElementsByClassName('wrap')[0];
			var listElem = wrapElem.getElementsByClassName('list')[0];
			
			delete contactsMap[publicId];
			listElem.removeChild(publicElem);
		};
		var deleteAllPublics = function() {
			var publicIds = Object.keys(publicMap);
			publicIds.forEach(deletePublic);
		};
		
		self.initialize = function() {
			initializeAccountElem();
			
			var authorizeListener = function(event) {
				userId = event.userId;
				
				chatClient.on('message:publiclist', publiclistClientChatListener);
				chatClient.on('message:users', usersClientChatListener);
				
				chatClient.publiclist();
				chatClient.users();
			};
			var disconnectListener = function(event) {
				chatClient.off('message:users');
				chatClient.off('message:retrieve');
				chatClient.off('message:publiclist');
				deleteAllPublics();
				deleteAllContacts();
			};
			
			//loading user profiles.
			var usersClientChatListener = function(event) {
				var users = event.response.users;
				var profileIds = users.filter(function(user) {
					return user !== userId;
				}).map(function(user) {
					return ['profile', user].join('.');
				});

				chatClient.off('message:users', usersClientChatListener);
				chatClient.on('message:retrieve', retrieveProfilesClientChatListener);
				chatClient.retrieve(profileIds.join());
			};
			var retrieveProfilesClientChatListener = function(event) {
				var profiles = event.response.retrieve;
				chatClient.off('message:retrieve', retrieveProfilesClientChatListener);
				createContactList(profiles);
			};
			
			//loading publiclist
			var publiclistClientChatListener = function(event) {
				var publiclist = event.response.publiclist;
				var publicIds = publiclist.map(function(public) {
					return public.id;
				});
				
				chatClient.off('message:publiclist', publiclistClientChatListener);
				chatClient.on('message:retrieve', retrievePublicsClientChatListener);
				chatClient.retrieve(publicIds.join(','));
			};
			var retrievePublicsClientChatListener = function(event) {
				var publicDetails = event.response.retrieve;
				chatClient.off('message:retrieve', retrievePublicsClientChatListener);
				createPublicList(publicDetails);
			};
			
			self.on('authorize', authorizeListener);
			self.on('disconnect', disconnectListener);
			self.on('select:contact', function(event) {
				alert(event.contactId);
			});
			self.on('select:public', function(event) {
				alert(event.publicId);	
			});
		};
		
		EventEmitter.call(self);
	};
	
	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};