window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var MessageStorage = messenger.storage.MessageStorage;
	
	var MessagePatternView = messenger.views.MessagePatternView;
	
	var VkTools = messenger.utils.VkTools;
	var ChatClientWrapper = messenger.utils.ChatClientWrapper;
	var Helpers = messenger.utils.Helpers;

	var MessageFactory = chat.MessageFactory;

	var MessengerApplication = function() {
		MessengerApplication.super.apply(this);
		var self = this;
		
		this.rootElem = document.getElementById('root');

		this.chatClient = new chat.ChatClient(settings.chatUrl);
		this.chatClientWrapper = new ChatClientWrapper(this.chatClient);
		
		this.messageStorage = new MessageStorage(this.chatClientWrapper);
		
		this.contactRepository = new messenger.repository.ContactRepository();
		this.chatRepository = new messenger.repository.ChatRepository(this.chatClientWrapper);

		this.mainMenuView = new messenger.views.MainMenuView();
		this.mainContainerView = new messenger.views.MainContainerView();
		this.postcardView = new messenger.views.PostcardView();
		this.postcardMenuView = new messenger.views.PostcardMenuView();
		this.conversationView = new messenger.views.ConversationView();
		this.conversationMenuView = new messenger.views.ConversationMenuView();
		this.lobbyView = new messenger.views.LobbyView();
		this.selectPageView = new messenger.views.SelectPageView();
		this.editPageView = new messenger.views.EditPageView();
		this.postPageView = new messenger.views.PostPageView();
		this.answerPageView = new messenger.views.AnswerPageView();
		
		this.postDialogView = new messenger.views.PostDialogView();
		this.skipDialogView = new messenger.views.SkipDialogView();
		this.preloadDialogView = new messenger.views.PreloadDialogView();
		this.askMessageDialogView = new messenger.views.AskMessageDialogView();
		this.errorDialogView = new messenger.views.ErrorDialogView();
		this.prepareChatDialogView = new messenger.views.PrepareChatDialogView();
		this.createMessageDialogView = new messenger.views.CreateMessageDialogView();

		this.currentSkipAnswerAsync = null;
		this.emptySkipAnswerAsync = function() {
			return Q.resolve(true);	
		};
		this.requestedSkipAnswerAsync = function() {
			var deferred = Q.defer();
			
			var cancelListener = function() {
				self.skipDialogView.off('click:ok', okListener);
				deferred.reject();
			};
			var okListener = function() {
				self.skipDialogView.off('click:cancel', cancelListener);
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				deferred.resolve();
			};
			
			self.skipDialogView.once('click:cancel', cancelListener);
			self.skipDialogView.once('click:ok', okListener);
			self.skipDialogView.setText('Вы уверены, что не хотите ответить на сообщение?');
			self.skipDialogView.show();
			
			return deferred.promise;
		};
		
		this.currentSkipUpdateAsync = null;
		this.emptySkipUpdateAsync = function() {
			return Q.resolve(true);
		};
		this.requestedSkipUpdateAsync = function() {
			var deferred = Q.defer();
			
			var cancelListener = function() {
				self.askMessageDialogView.off('click:ok', okListener);
				deferred.reject();
			};
			var okListener = function() {
				self.askMessageDialogView.off('click:cancel', cancelListener);
				self.currentSkipAnswerAsync = self.emptySkipUpdateAsync;
				deferred.resolve();
			};
			
			self.askMessageDialogView.once('click:cancel', cancelListener);
			self.askMessageDialogView.once('click:ok', okListener);
			self.askMessageDialogView.show();
			
			return deferred.promise;
		};
		
		this.preloadDialogView.show();
		this.initializeStorage();
		this.initializeChatClient();
		this.initializeViews();
		this.initializeSettings();
		this.initializeStartupData();
	};
	MessengerApplication.super = EventEmitter;
	MessengerApplication.prototype = Object.create(EventEmitter.prototype);
	MessengerApplication.prototype.constructor = MessengerApplication;
	MessengerApplication.prototype.initializeStorage = function() {
		var self = this;
		
		this.messageStorage.on('add:message', function(event) {
			var message = event.message;
			var first = event.first;
			var messagePatternView = new MessagePatternView(message);
			self.selectPageView.addMessagePatternView(messagePatternView, first);
		});
		this.messageStorage.on('select:message', function(event) {
			var message = event.message;
			self.editPageView.setMessage(message);
		});
		this.messageStorage.on('preload:update', function(event) {
			var count = event.count;
			self.selectPageView.setPreloadedMessageCount(count);
		});
		this.messageStorage.on('end:messages', function() {
			self.selectPageView.hideMessageLoading();	
		});
		
		this.chatRepository.on('empty:last-contact', function() {
			var chatContact = self.contactRepository.getFirstNonOwnUser();
			self.mainMenuView.conversationItemView.setText(chatContact.getFullName());
			self.chatRepository.setContact(chatContact);
		});
		this.chatRepository.on('update:last-contact', function(event) {
			var lastContactId = event.lastContactId;
			var chatContact = self.contactRepository.getChatUserByVkid(lastContactId);
			self.mainMenuView.conversationItemView.setText(chatContact.getFullName());
			self.chatRepository.setContact(chatContact);
		});
		this.chatRepository.on('add:message', function(event) {
			var message = event.message;
			var shown = message.get('shown');
			var fromContact = self.contactRepository.getChatUserByVkid(message.get('from'));
			var toContact = self.contactRepository.getChatUserByVkid(message.get('to'));
			var ownerContact = self.contactRepository.owner;
			if (!shown && fromContact && fromContact !== ownerContact) {
				var unread = fromContact.get('unread');
				fromContact.set('unread', unread + 1);
				self.mainMenuView.increaseUnreadCount();
				message.once('change:shown', function(event) {
					var unread = fromContact.get('unread');
					fromContact.set('unread', unread - 1);
					self.mainMenuView.decreaseUnreadCount();
				});
			}
			if (fromContact && toContact && fromContact !== toContact) {
				if (fromContact !== ownerContact && toContact === ownerContact) {
					self.conversationView.addTapeItem(fromContact.get('id'), message, fromContact);
				} else if (fromContact === ownerContact && toContact !== ownerContact) {
					self.conversationView.addTapeItem(toContact.get('id'), message, fromContact);
				}
			}
		});
		this.chatRepository.on('remove:message', function(event) {
			var messageId = event.messageId;
		});
		
		(function() {
			var users = null;
			var chatUsers = null;
			var groups = null;
			
			self.contactRepository.on('search:chat-users', function(event) {
				if (chatUsers) chatUsers.dispose();
				self.lobbyView.clear();
				self.lobbyView.showLoader();
				self.lobbyView.off('click:load');
				self.lobbyView.on('click:load', function() {
					chatUsers.next();	
				});
				chatUsers = event.chatUsers;
				chatUsers.on('paginate:item', function(event) {
					var user = event.item;
					self.lobbyView.addUser(user);
				});
				chatUsers.on('paginate:end', function(event) {
					self.lobbyView.hideLoader();
				});
				chatUsers.next();
			});
			self.contactRepository.on('search:users', function(event) {
				if (users) users.dispose();
				self.postPageView.friendSearchView.clear();
				self.postPageView.friendSearchView.showLoader();
				self.postPageView.friendSearchView.off('click:load');
				self.postPageView.friendSearchView.on('click:load', function() {
					users.next();
				});
				users = event.users;
				users.on('paginate:item', function(event) {
					var friend = event.item;
					self.postPageView.friendSearchView.addFriend(friend);
				});
				users.on('paginate:end', function(event) {
					self.postPageView.friendSearchView.hideLoader();
				});
				users.next();
			});
			self.contactRepository.on('search:groups', function(event) {
				if (groups) groups.dispose();
				self.postPageView.groupSearchView.clear();
				self.postPageView.groupSearchView.showLoader();
				self.postPageView.groupSearchView.off('click:load');
				self.postPageView.groupSearchView.on('click:load', function() {
					groups.next();	
				});
				groups = event.groups;
				groups.on('paginate:item', function(event) {
					var group = event.item;
					self.postPageView.groupSearchView.addGroup(group);
				});
				groups.on('paginate:end', function(event) {
					self.postPageView.groupSearchView.hideLoader();
				});
				groups.next();
			});
			self.contactRepository.on('empty:groups', function(event) {
				self.postPageView.disableGroupTab();
			});
		})();
	};
	MessengerApplication.prototype.initializeChatClient = function() {
		var self = this;
		
		var checkOnline = function() {
			self.chatClientWrapper.nowAsync().then(function() {
				self.trigger('online');
			}).catch(function() {
				self.trigger('offline');
			});
		};
		var reconnect = function() {
			var vkId = Helpers.buildVkId(self.contactRepository.owner);
			VK.initAsync().then(function() {
				return self.chatClientWrapper.connectAndLoginAsync(vkId);
			}).then(function() {
				self.trigger('online');
			}).catch(function() {
				self.trigger('offline');
			});
		};
		
		this.on('online', function() {
			//self.onlineElem.classList.remove('invalid');
			setTimeout(function() {
				checkOnline();
			}, 2500);
		});
		this.on('offline', function() {
			//self.onlineElem.classList.add('invalid');
			setTimeout(function() {
				reconnect();
			}, 5000);
		});
		
		this.chatClient.once('message:login', function() {
			checkOnline();	
		});
	};
	MessengerApplication.prototype.initializeViews = function() {
		var self = this;

		this.mainMenuView.attachTo(this.rootElem);
		this.mainContainerView.attachTo(this.rootElem);
		this.answerPageView.attachTo(this.mainContainerView.elem);
		this.postcardView.attachTo(this.mainContainerView.elem);
		this.postcardMenuView.attachTo(this.postcardView.elem);
		this.conversationView.attachTo(this.mainContainerView.elem);
		this.conversationMenuView.attachTo(this.conversationView.elem);
		this.lobbyView.attachTo(this.mainContainerView.elem);
		
		this.selectPageView.attachTo(this.postcardView.elem);
		this.editPageView.attachTo(this.postcardView.elem);
		this.postPageView.attachTo(this.postcardView.elem);
		
		this.defaultPostClickHandler = function() {
			self.answerPageView.hide();
			self.selectPageView.hide();
			self.editPageView.hide();
			self.postPageView.show();
		};
		this.chatPostClickHandler = function() {
			self.postcardView.hide();
			self.lobbyView.hide();
			self.conversationView.show();
			//self.mainMenuView.enableShadow(true);
		};
		this.currentPostClickHandler = this.defaultPostClickHandler;
		
		this.defaultPostcardClickHandler = function() {
			self.answerPageView.hide();
			self.postcardView.show();
			self.conversationView.hide();
		};
		this.chatPostcardClickHandler = function() {
			self.answerPageView.hide();
			self.lobbyView.hide();
			self.postcardView.show();
			self.conversationView.hide();
			
			self.postcardMenuView.hideCancel();
			self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
			self.postcardMenuView.postItemView.setText('3. Отправь на стену!');
			self.postcardMenuView.selectItemView.select();
			self.currentPostClickHandler = self.defaultPostClickHandler;
			self.currentPostcardClickHandler = self.defaultPostcardClickHandler;
		};
		this.currentPostcardClickHandler = this.defaultPostcardClickHandler;
		
		this.mainMenuView.on('click:answer', function() {
			self.answerPageView.show();
			self.postcardView.hide();
			self.lobbyView.hide();
			self.conversationView.hide();
		});
		this.mainMenuView.on('click:logo', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.mainMenuView.postcardItemView.select();
				self.postcardMenuView.selectItemView.select();
			});
		});
		this.mainMenuView.on('click:postcard', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.currentPostcardClickHandler();
			}).catch(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		});
		this.mainMenuView.on('click:dialog', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.hide();
				self.lobbyView.show();
				self.conversationView.hide();
				self.mainMenuView.enableShadow(true);
			}).catch(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		});
		this.mainMenuView.on('click:conversation', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.hide();
				self.lobbyView.hide();
				self.conversationView.show();
				self.mainMenuView.enableShadow(false);
			}).catch(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		});
		
		this.postcardMenuView.on('click:select', function() {
			self.answerPageView.hide();
			self.selectPageView.show();
			self.editPageView.hide();
			self.postPageView.hide();
		});
		this.postcardMenuView.on('click:edit', function() {
			self.answerPageView.hide();
			self.selectPageView.hide();
			self.editPageView.show();
			self.postPageView.hide();
		});
		this.postcardMenuView.on('click:post', function() {
			self.currentSkipUpdateAsync().then(function() {
				self.currentPostClickHandler();
			}).catch(function() {
				self.currentSkipUpdateAsync = self.emptySkipUpdateAsync;
				self.postcardMenuView.editItemView.select();
				self.currentSkipUpdateAsync = self.requestedSkipUpdateAsync;
			});
		});
		this.postcardMenuView.on('click:cancel', function() {
			self.conversationView.show();
			self.postcardView.hide();
			self.postcardMenuView.hideCancel();
			self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
			self.postcardMenuView.postItemView.setText('3. Отправь на стену!');
			//self.mainMenuView.enableShadow(true);
			self.currentPostClickHandler = self.defaultPostClickHandler;
			self.currentPostcardClickHandler = self.defaultPostcardClickHandler;
		});
		this.postcardMenuView.selectItemView.select();
		
		this.conversationMenuView.on('click:filmtext', function() {
			self.conversationView.hide();
			self.postcardView.show();
			self.postcardMenuView.selectItemView.select();
			self.postcardMenuView.showCancel();
			self.mainMenuView.enableShadow(false);
			self.postcardMenuView.editItemView.setText('2. Напиши сценарий!');
			self.postcardMenuView.postItemView.setText('3. Отправь в чат!');
			self.currentPostClickHandler = self.chatPostClickHandler;
			self.currentPostcardClickHandler = self.chatPostcardClickHandler;
		});
		this.conversationMenuView.on('click:postcard', function() {
			self.conversationView.hide();
			self.postcardView.show();
			self.postcardMenuView.selectItemView.select();
			self.postcardMenuView.showCancel();
			self.mainMenuView.enableShadow(false);
			self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
			self.postcardMenuView.postItemView.setText('3. Отправь в чат!');
			self.currentPostClickHandler = self.chatPostClickHandler;
			self.currentPostcardClickHandler = self.chatPostcardClickHandler;
		});
		this.conversationMenuView.on('click:text', function() {
			self.createMessageDialogView.show();
		});
		
		this.prepareDialogsHandler = function() {
			self.prepareChatDialogView.show();
			self.chatRepository.loadTapeMessagesAsync().then(function() {
				self.currentPrepareDialogsHandler = self.emptyPrepareDialogsHandler;
				self.prepareChatDialogView.setMode('complete');
				self.contactRepository.searchChatUsers('');
				self.lobbyView.selectUser(self.chatRepository.getContact());
			}).catch(function(error) {
				self.prepareChatDialogView.setMode('fail');
				self.prepareChatDialogView.once('click:close', function() {
					self.mainMenuView.postcardItemView.select();
				});
				console.log(error);
			});
		};
		this.emptyPrepareDialogsHandler = function() { };
		this.currentPrepareDialogsHandler = this.prepareDialogsHandler;
		
		this.lobbyView.on('show', function() {
			self.currentPrepareDialogsHandler();
		});
		this.lobbyView.on('search:users', function(event) {
			self.contactRepository.searchChatUsers(event.text);
		});
		this.lobbyView.once('select:user', function(event) {
			var user = event.user;
			var options = event.options;
			
			self.chatRepository.setContact(user);
			self.conversationView.switchMessageTape(user.get('id'));
			if (options !== 'persist') {
				self.mainMenuView.conversationItemView.setText(user.getFullName());
				self.mainMenuView.conversationItemView.select();
			}
			
			self.lobbyView.on('select-force:user', function(event) {
				var user = event.user;
				self.chatRepository.setContact(user);
				self.conversationView.switchMessageTape(user.get('id'));
				self.mainMenuView.conversationItemView.setText(user.getFullName());
				self.mainMenuView.conversationItemView.select();
			});
		});

		this.conversationView.on('show', function() {
			self.currentPrepareDialogsHandler();
		});
		
		this.answerPageView.on('click:answer', function(event) {
			self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
			self.mainMenuView.postcardItemView.select();
			self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
		});
		
		this.selectPageView.on('select:message', function(event) {
			var message = event.message;
			self.messageStorage.selectMessage(message);
		});
		this.selectPageView.on('click:load', function(event) {
			self.selectPageView.disableMessageLoading();
			self.messageStorage.loadMessagesAsync().then(function() {
				analytics.send('tape', 'msg_load_more', 'success');
			}).catch(function(error) {
				self.errorDialogView.show(error);
				analytics.send('tape', 'msg_load_more', 'fail');
			}).fin(function() {
				self.selectPageView.enableMessageLoading();
			});
		});
		this.selectPageView.on('click:preload', function(event) {
			self.messageStorage.appendPreloadedMessages();	
			analytics.send('tape', 'msg_load_new', 'success');
		});
		
		this.postPageView.on('click:send', function(event) {
			self.postDialogView.show();
			
			var account = self.contactRepository.owner;
			var companion = self.contactRepository.selected;
			var content = self.editPageView.getMessageContent();
			var message = MessageFactory.create(
				uuid.v4(),
				Helpers.normalizeMessageContent(content),
				Helpers.buildVkId(account),
				Helpers.buildVkId(companion)
			);
			var messageTarget = Helpers.getMessageTarget(account, companion);
			var action = ['post', messageTarget].join('_');
			var shareMessageUrl = VkTools.calculateMessageShareUrl(message.id);
			
			self.chatClientWrapper.nowAsync().then(function(timestamp) {
				VkTools.checkPostAccess(companion);
				self.postDialogView.setText('Этап 2 из 5: Сохранение сообщения...');
				message.timestamp = timestamp;
				return self.chatClientWrapper.sendMessageAsync(message);
			}).then(function() {
				self.postDialogView.setText('Этап 3 из 5: Создание превью...');
				return VkTools.getWallPhotoUploadUrlAsync();
			}).then(function(uploadUrl) {
				return VkTools.generatePreviewAsync(shareMessageUrl, uploadUrl);
			}).then(function(response) {
				self.postDialogView.setText('Этап 4 из 5: Сохранение превью в альбоме...');
				var uploadResult = response.uploadResult;
				var image = response.image;
				message.preview = image;
				self.chatClient.notifyMessage(message);
				uploadResult.v = 5.12;
				return VK.apiAsync('photos.saveWallPhoto', uploadResult);
			}).then(function(response) {
				self.postDialogView.setText('Этап 5 из 5: Публикация сообщения на стене...');
				var imageId = VkTools.getUploadedFileId(response);
				var ownerId = companion.get('id');
				var senderId = account.get('id');
				var postData = VkTools.createVkPost(message, ownerId, senderId, imageId, shareMessageUrl);
				return VK.apiAsync('wall.post', postData);
			}).then(function() {
				self.postDialogView.setMode('complete');
				analytics.send('post', action, 'success');
			}).catch(function(error) {
				self.postDialogView.setMode('fail', error);
				console.error(error);
				analytics.send('post', action, VkTools.formatError(error));
			});	
		});
		this.postPageView.friendSearchView.on('search:users', function(event) {
			self.contactRepository.searchUsers(event.text);
		});
		this.postPageView.groupSearchView.on('search:groups', function(event) {
			self.contactRepository.searchGroups(event.text);
		});
		this.postPageView.friendSearchView.on('select:user', function(event) {
			self.contactRepository.selected = event.user;
		});
		this.postPageView.groupSearchView.on('select:group', function(event) {
			self.contactRepository.selected = event.group;
		});
		
		this.editPageView.on('status:validate', function() {
			self.currentSkipUpdateAsync = self.emptySkipUpdateAsync;
		});
		this.editPageView.on('status:invalidate', function() {
			self.currentSkipUpdateAsync = self.requestedSkipUpdateAsync;
		});
		
		this.postDialogView.on('click:close', function(event) {
			if (self.currentSkipAnswerAsync === self.requestedSkipAnswerAsync) {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.postPageView.friendSearchView.selectFriend(self.contactRepository.owner);
				self.postPageView.setMode('friend');
				self.postcardMenuView.selectItemView.select();
				window.location.hash = '';
			}	
		});
		this.skipDialogView.on('click:ok', function(event) {
			self.postPageView.friendSearchView.selectFriend(self.contactRepository.owner);
			self.postPageView.setMode('friend');
			self.postcardMenuView.selectItemView.select();
			window.location.hash = '';
			analytics.send('answer', 'browse_tape');
		});
		this.askMessageDialogView.on('click:ok', function() {
			self.editPageView.reset();
		});
	};
	MessengerApplication.prototype.initializeSettings = function() {
		var parseHash = function(hash) {
			var settings = {};
			hash = hash.indexOf('=') === 0 ? hash.substring(1) : hash;
			hash = hash.replace('amp;', '');
			hash.split('&').forEach(function(item) {
				var pair = item.split('=');
				var key = pair[0];
				var value = pair[1];
				settings[key] = value;
			});
			return settings;
		};
		var parseSearch = function(search) {
			var settings = {};
			search.substring(1).split('&').forEach(function(item) {
				var pair = item.split('=');
				var key = pair[0];
				var value = pair[1];
				settings[key] = value;
			});
			return settings;
		};
		
		var search = window.location.search;
		var searchSettings = parseSearch(search);
		var hash = searchSettings.hash ? decodeURIComponent(searchSettings.hash) : null;

		if (hash) {
			var settings = parseHash(hash);
			this.contactRepository.setSenderId(settings.senderId);
			this.messageStorage.setSenderMessageId(settings.messageId);
			this.currentSkipAnswerAsync = this.requestedSkipAnswerAsync;
			this.mainMenuView.answerItemView.select();
		} else {
			this.currentSkipAnswerAsync = this.emptySkipAnswerAsync;
			this.mainMenuView.postcardItemView.select();
		}
	};
	MessengerApplication.prototype.initializeStartupData = function() {
		var self = this;
		
		VK.initAsync().then(function() {
			return self.contactRepository.initializeAsync();
		}).then(function() {
			var owner = self.contactRepository.owner;
			var vkId = Helpers.buildVkId(owner);
			return self.chatClientWrapper.connectAndLoginAsync(vkId);
		}).then(function() {
			var owner = self.contactRepository.owner;
			var vkId = Helpers.buildVkId(owner);
			return self.chatRepository.loadSettingsAsync(vkId);
		}).then(function() {
			return self.messageStorage.loadMessagesAsync();
		}).then(function() {
			self.answerPageView.setContact(self.contactRepository.sender);
			self.answerPageView.setMessage(self.messageStorage.getSenderMessage());
			self.preloadDialogView.hide();
			analytics.send('app_start', 'app_success');
		}).catch(function(error) {
			analytics.send('app_start', 'app_fail');
			console.error(error);
			alert('Приносим извенение. В настоящий момент в работе приложения наблюдаются проблемы. Возможно вы используете неподдерживаемый браузер. Установите Chrome, Opera, YaBrowser или Safari');
		});
	};

	var messengerApplication = new MessengerApplication();
};