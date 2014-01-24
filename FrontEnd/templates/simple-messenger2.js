window.onload = function() {
	
	var EventEmitter = chat.EventEmitter;
	var ChatClient = chat.ChatClient;
	
	var createTemplateElem = function(className) {
		var templatesElem = document.getElementById('template');
		var templateElem = templatesElem.getElementsByClassName(className)[0];
		var newTemplateElem = templateElem.cloneNode(true);
		return newTemplateElem;
	};
	
	var Counter = function(size) {
		var self = this;
		var _size = size || 0;
		
		self.reset = function(size) {
			_size = size;
		};
		self.release = function() {
			_size--;
			_size = _size <= 0 ? 0 : _size;
			if (_size === 0) {
				self.trigger('empty');
			}
		};
		self.add = function() {
			_size++;	
		};
		
		EventEmitter.call(self);
	};
	
	var ChatApplication = function() {
		var self = this;
		
		var serverUrl = 'ws://www.bazelevscontent.net:9009/';
		var chatClient = new ChatClient(serverUrl);
		
		var menuElem = document.getElementById('menu');
		var contactsElem = document.getElementById('contacts');
		
		var loadOperationCounter = new Counter();
		var userId = null;
		
		var contactsMap = {};
		var profiles = {};
		
		var publicMap = {};
		var publicDetails = {};
		
		var themeMap = {};
		var themes = {};

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
			profiles[profile.id] = profile;
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
			contactsMap = {};
			profiles = {};
		};
		
		var updateOnlineContact = function(userId, isOnline) {
			var profileId = ['profile', userId].join('.');
			var contactElem = contactsMap[profileId];
			if (!contactElem) {
				return;
			}
			if (isOnline) {
				contactElem.classList.remove('offline');
				contactElem.classList.add('online');
			} else {
				contactElem.classList.remove('online');
				contactElem.classList.add('offline');
			}
		};
		var updateOnlineContacts = function(onlineUsers) {
			onlineUsers.forEach(function(userId) {
				updateOnlineContact(userId, true);	
			});	
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
				publicDetails[publicDetail.id] = publicDetail;
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
			
			delete publicMap[publicId];
			listElem.removeChild(publicElem);
		};
		var deleteAllPublics = function() {
			var publicIds = Object.keys(publicMap);
			publicIds.forEach(deletePublic);
			publicMap = {};
			publicDetails = {};
		};
		
		var createTheme = function(theme) {
			var wrapElem = contactsElem.getElementsByClassName('wrap')[0];
			var listElem = wrapElem.getElementsByClassName('list')[0];
			
			var newThemeElem = createTemplateElem('theme');
			var avatarImageElem = newThemeElem.getElementsByClassName('avatar-image')[0];
			var nameTextElem = newThemeElem.getElementsByClassName('name-text')[0];
			
			var themeValue = theme.value;
			
			if (themeValue) {
				newThemeElem.title = themeValue.id;
				nameTextElem.textContent = '[' + themeValue.label + ']';
				avatarImageElem.src = 'http://simpleicon.com/wp-content/uploads/group-1.png';
				
				newThemeElem.addEventListener('click', function() {
					self.trigger({
						type: 'select:theme',
						themeId: themeValue.id
					});
				});
				
				themeMap[theme.id] = newThemeElem;
				publicDetails[theme.id] = theme;
				listElem.appendChild(newThemeElem);
			}
		};
		var createThemeList = function(themeList) {
			themeList.forEach(createTheme);
		};
		var deleteTheme = function(themeId) {
			var themeElem = themeMap[themeId];
			var wrapElem = contactsElem.getElementsByClassName('wrap')[0];
			var listElem = wrapElem.getElementsByClassName('list')[0];

			delete themeMap[themeId];
			listElem.removeChild(themeElem);
		};
		var deleteAllThemes = function() {
			var themeIds = Object.keys(themeMap);
			themeIds.forEach(deleteTheme);
			themeMap = {};
			themes = {};
		};
		
		var updateConverstationTitle = function(title) {
			var conversationElem = document.getElementById('conversation');
			var wrapElem = conversationElem.getElementsByClassName('wrap')[0];
			
			wrapElem.textContent = title;
		};
		var showConversationTitle = function(isVisible) {
			var conversationElem = document.getElementById('conversation');
			var wrapElem = conversationElem.getElementsByClassName('wrap')[0];
			
			if (isVisible) {
				wrapElem.classList.add('active');
				wrapElem.classList.remove('passive');
			} else {
				wrapElem.classList.add('passive');
				wrapElem.classList.add('active');
			}
		};
		
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
		
		self.initialize = function() {
			var groupLoadCounter = new Counter(2);
			groupLoadCounter.on('empty', function() {
				chatClient.users();
			});
						
			showConversationTitle(false);
			updateConverstationTitle('');
			initializeAccountElem();
			
			var authorizeListener = function(event) {
				userId = event.userId;
				loadOperationCounter.reset(3);
				groupLoadCounter.reset(2);
				loadOperationCounter.on('empty', emptyLoadOperationCounterListener);
				
				chatClient.on('message:publiclist', publiclistClientChatListener);
				chatClient.on('message:subscribelist', subscribelistClienChatListener);
				chatClient.on('message:users', usersClientChatListener);
				
				chatClient.publiclist();
				chatClient.subscribelist();

			};
			var disconnectListener = function(event) {
				chatClient.off('message:users');
				chatClient.off('message:retrieve');
				chatClient.off('message:publiclist');
				chatClient.off('message:send');
				chatClient.off('message:online');
				chatClient.off('message:subscribelist');
				loadOperationCounter.off('empty', emptyLoadOperationCounterListener);
				
				deleteAllPublics();
				deleteAllContacts();
				deleteAllThemes();
				
				updateConverstationTitle('');
				showConversationTitle(false);
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
				chatClient.on('message:online', onlineClientChatListener);
				chatClient.online();
				createContactList(profiles);
				loadOperationCounter.release();
			};
			var onlineClientChatListener = function(event) {
				var online = event.response.online;
				chatClient.off('message:online', onlineClientChatListener);
				updateOnlineContacts(online);
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
				loadOperationCounter.release();	
				groupLoadCounter.release();
			};
			
			//loading themes
			var subscribelistClienChatListener = function(event) {
				var subscribelist = event.response.subscribelist;
				var themeIds = subscribelist.filter(function(item) {
					return item.type !== 'public';	
				}).map(function(item) {
					return item.id;
				});

				chatClient.off('message:subscribelist', subscribelistClienChatListener);
				chatClient.on('message:retrieve', retrieveThemesClientChatListener);
				chatClient.retrieve(themeIds.join(','));
			};
			var retrieveThemesClientChatListener = function(event) {
				var themes = event.response.retrieve;
				chatClient.off('message:retrieve', retrieveThemesClientChatListener);
				createThemeList(themes);
				loadOperationCounter.release();
				groupLoadCounter.release();
			};
			
			//all startup info loaded
			var emptyLoadOperationCounterListener = function() {
				loadOperationCounter.off('empty', loadOperationCounter);
				chatClient.on('message:send', sendChatClientListener);
			};
			var sendChatClientListener = function(event) {
				alert(JSON.stringify(event.response.send, null, 4));
			};
			
			self.on('authorize', authorizeListener);
			self.on('disconnect', disconnectListener);
			
			self.on('select:contact', function(event) {
				var contactId = event.contactId;
				var profileId = ['profile', contactId].join('.');
				var profile = profiles[profileId];
				var value = profile.value || {};
				var nickname = value.nickname || contactId;
				var title = [nickname, 'and', 'Me'].join(' ');

				updateConverstationTitle(title);
				showConversationTitle(true);
			});
			self.on('select:public', function(event) {
				alert(event.publicId);
				showConversationTitle(true);
			});
			self.on('select:theme', function(event) {
				alert(event.themeId);
			})
		};
		
		EventEmitter.call(self);
	};
	
	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};