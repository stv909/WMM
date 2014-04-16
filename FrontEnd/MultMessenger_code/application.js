window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var MessageStorage = messenger.storage.MessageStorage;
	
	var MessagePatternView = messenger.ui.MessagePatternView;
	var ChatMessageModel = messenger.data.ChatMessageModel;

	var MessageFactory = messenger.chat.MessageFactory;
	var MessageTargets = messenger.misc.MessageTargets;

	var MessengerApplication = function() {
		MessengerApplication.super.apply(this);
		var self = this;
		
		this.rootElem = document.getElementById('root');
		this.newMessageSoundElem = document.getElementById('new-message-sound');

		this.chatClient = new messenger.chat.ChatClient(messenger.Settings.chatUrl);
		this.chatClientWrapper = new messenger.misc.ChatClientWrapper(this.chatClient);
		this.messageSender = new messenger.MessageSender(this.chatClientWrapper, getDialogAwaitToken);
		
		this.messageStorage = new MessageStorage(this.chatClientWrapper);
		
		this.contactRepository = new messenger.repository.ContactRepository();
		this.chatRepository = new messenger.repository.ChatRepository(this.chatClientWrapper);

		this.mainMenuView = new messenger.views.MainMenuView();
		this.mainContainerView = new messenger.ui.MainContainerView();
		this.postcardView = new messenger.ui.PostcardView();
		this.postcardMenuView = new messenger.views.PostcardMenuView();
		this.conversationView = new messenger.views.ConversationView();
		this.conversationMenuView = new messenger.views.ConversationMenuView();
		this.lobbyView = new messenger.views.LobbyView();
		this.selectPageView = new messenger.views.SelectPageView();
		this.editPageView = new messenger.views.EditPageView();
		this.postPageView = new messenger.views.PostPageView();
		this.dialogPostPageView = new messenger.views.DialogPostPageView();
		this.answerPageView = new messenger.views.AnswerPageView();

		this.skipDialogView = new messenger.ui.SkipDialogView();
		this.preloaderView = new messenger.ui.PreloaderView();
		this.inviteUserDialogView = new messenger.ui.InviteUserDialogView();
		this.errorDialogView = new messenger.ui.ErrorDialogView();
		this.cancelMessageUpdateDialogView = new messenger.ui.CancelMessageUpdateDialogView();
		this.createMessageDialogView = new messenger.ui.CreateTextMessageDialogView();
		this.prepareChatDialogView = new messenger.ui.PrepareChatDialogView();

		this.postDialogView = new messenger.views.PostDialogView();

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
				self.cancelMessageUpdateDialogView.off('click:ok', okListener);
				deferred.reject();
			};
			var okListener = function() {
				self.cancelMessageUpdateDialogView.off('click:cancel', cancelListener);
				self.currentSkipAnswerAsync = self.emptySkipUpdateAsync;
				deferred.resolve();
			};
			
			self.cancelMessageUpdateDialogView.once('click:cancel', cancelListener);
			self.cancelMessageUpdateDialogView.once('click:ok', okListener);
			self.cancelMessageUpdateDialogView.show();
			
			return deferred.promise;
		};

		function getDialogAwaitToken() {
			return self.currentDialogsWaitAsync();
		}
		this.currentDialogsWaitAsync = function() {
			var deferred = Q.defer();

			self.once('complete:dialogs', function() {
				deferred.resolve();
				self.currentDialogsWaitAsync = self.successDialogsWaitAsync;
			});
			self.once('fail:dialogs', function() {
				deferred.reject();
				self.currentDialogsWaitAsync = self.failDialogsWaitAsync;
			});

			return deferred.promise;
		};
		this.successDialogsWaitAsync = function() {
			var deferred = Q.defer();

			setTimeout(function() {
				deferred.resolve();
			}, 0);

			return deferred.promise;
		};
		this.failDialogsWaitAsync = function() {
			var deferred = Q.defer();

			setTimeout(function() {
				deferred.reject('dialogs failed');
			}, 0);

			return deferred.promise;
		};
		
		this.preloaderView.show();
		this.initializeStorage();
		this.initializeChatClient();
		this.initializeViews();
		this.initializeSettings();
		this.initializeMessageSender();
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
			var messagePatternView = new MessagePatternView(message, true);
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
			self.selectPageView.disableMessageLoading(true);
		});
		this.messageStorage.on('continue:messages', function() {
			self.selectPageView.enableMessageLoading();
		});
		
		this.chatRepository.on('empty:last-contact', function() {
			var chatContact = self.contactRepository.getFirstNonOwnUser();
			self.mainMenuView.conversationItemView.setText(chatContact.getFullName());
			self.chatRepository.setContact(chatContact);
			self.dialogPostPageView.setContact(chatContact);
		});
		this.chatRepository.on('update:last-contact', function(event) {
			var lastContactId = event.lastContactId;
			var chatContact = self.contactRepository.getChatUserByVkid(lastContactId);
			self.mainMenuView.conversationItemView.setText(chatContact.getFullName());
			self.chatRepository.setContact(chatContact);
			self.dialogPostPageView.setContact(chatContact);
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
				if (!event.noSearch) {
					self.lobbyView.updateUserSearch();
				}
				message.once('set:shown', function(event) {
					var unread = fromContact.get('unread');
					var messageId = message.get('id');
					fromContact.set('unread', unread - 1);
					self.mainMenuView.decreaseUnreadCount();
					self.chatClient.shown(['msg', messageId].join('.'));
					self.lobbyView.updateUserSearch();
				});
			}
			if (fromContact && toContact && fromContact !== toContact) {
				if (fromContact !== ownerContact && toContact === ownerContact) {
					self.conversationView.addTapeItem(fromContact.get('id'), message, fromContact);
				} else if (fromContact === ownerContact && toContact !== ownerContact) {
					message.set('shown', true);
					message.set('own', true);
					self.conversationView.addTapeItem(toContact.get('id'), message, fromContact);
				}
				self.trigger('enable:dialogs');
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
				});
				chatUsers.next();
			});
			self.contactRepository.on('search:users', function(event) {
				if (users) users.dispose();
				self.postPageView.friendSearchView.clear();
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
				});
				users.next();
			});
			self.contactRepository.on('search:groups', function(event) {
				if (groups) groups.dispose();
				self.postPageView.groupSearchView.clear();
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
			self.chatClientWrapper.nowAsync(10000).then(function() {
				self.trigger('online');
			}).catch(function() {
				self.trigger('offline');
			});
		};
		var reconnect = function() {
			var vkId = messenger.misc.Helper.buildVkId(self.contactRepository.owner);
			messenger.vk.initAsync().then(function() {
				return self.chatClientWrapper.connectAndLoginAsync(vkId);
			}).then(function() {
				self.trigger('online');
			}).catch(function() {
				self.trigger('offline');
			});
		};
		
		this.on('online', function() {
			setTimeout(function() {
				checkOnline();
			}, 2500);
		});
		this.on('offline', function() {
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
		this.dialogPostPageView.attachTo(this.postcardView.elem);
		
		this.defaultPostClickHandler = function() {
			self.answerPageView.hide();
			self.selectPageView.hide();
			self.editPageView.hide();
			self.postPageView.show();
			self.dialogPostPageView.hide();
		};
		this.chatPostClickHandler = function() {
			self.answerPageView.hide();
			self.selectPageView.hide();
			self.editPageView.hide();
			self.postPageView.hide();
			self.dialogPostPageView.show();
		};
		this.currentPostClickHandler = this.defaultPostClickHandler;
		
		this.defaultPostcardClickHandler = function() {
			self.answerPageView.hide();
			self.postcardView.show();
			self.conversationView.hide();

			self.postcardMenuView.hideCancel();
			self.postcardMenuView.selectItemView.select();
			self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
			self.postcardMenuView.postItemView.setText('3. Отправь на стену!');
			self.currentPostClickHandler = self.defaultPostClickHandler;
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

		this.emptyClickDialogHandler = function() {
			self.mainMenuView.restore();
		};
		this.standardClickDialogHandler = function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.hide();
				self.lobbyView.show();
				self.conversationView.hide();
				self.mainMenuView.enableShadow(true);
			}).catch(function(error) {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		};
		this.currentClickDialogHandler = this.emptyClickDialogHandler;
		this.mainMenuView.on('click:dialog', function() {
			self.currentClickDialogHandler();
		});

		this.emptyClickConversationHandler = function() {
			self.mainMenuView.restore();
		};
		this.standardClickConversationHandler = function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.hide();
				self.lobbyView.hide();
				self.conversationView.show();
				self.mainMenuView.enableShadow(false);
			}).catch(function(error) {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		};
		this.currentClickConversationHandler = this.emptyClickConversationHandler;
		this.mainMenuView.on('click:conversation', function() {
			self.currentClickConversationHandler();
		});
		
		this.postcardMenuView.on('click:select', function() {
			self.answerPageView.hide();
			self.selectPageView.show();
			self.editPageView.hide();
			self.postPageView.hide();
			self.dialogPostPageView.hide();
		});
		this.postcardMenuView.on('click:edit', function() {
			self.answerPageView.hide();
			self.selectPageView.hide();
			self.editPageView.show();
			self.postPageView.hide();
			self.dialogPostPageView.hide();
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
			self.postcardMenuView.postItemView.setText('3. Отправь в диалог!');
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
			self.postcardMenuView.postItemView.setText('3. Отправь в диалог!');
			self.currentPostClickHandler = self.chatPostClickHandler;
			self.currentPostcardClickHandler = self.chatPostcardClickHandler;
		});
		this.conversationMenuView.on('click:text', function() {
			self.createMessageDialogView.show();
		});
		this.conversationView.on('click:hint', function() {
			self.conversationView.hide();
			self.postcardView.show();
			self.postcardMenuView.selectItemView.select();
			self.postcardMenuView.showCancel();
			self.mainMenuView.enableShadow(false);
			self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
			self.postcardMenuView.postItemView.setText('3. Отправь в диалог!');
			self.currentPostClickHandler = self.chatPostClickHandler;
			self.currentPostcardClickHandler = self.chatPostcardClickHandler;
		});
		this.conversationView.on('click:answer', function(event) {
			var message = event.message;
			self.selectPageView.deselect();
			self.editPageView.setMessage(message);
			self.conversationView.hide();
			self.postcardView.show();
			self.postcardMenuView.showCancel();
			self.postcardMenuView.editItemView.select();
			self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
			self.postcardMenuView.postItemView.setText('3. Отправь в диалог!');
			self.currentPostClickHandler = self.chatPostClickHandler;
		});
		this.conversationView.on('click:wall', function(event) {
			var message = event.message;
			var contact = self.chatRepository.contact;
			self.selectPageView.deselect();
			self.editPageView.setMessage(message);
			self.mainMenuView.postcardItemView.select();
			self.postPageView.setMode('friend');
			self.postPageView.friendSearchView.selectFriend(contact);
			self.postPageView.friendSearchView.trigger({
				type: 'select:user',
				user: contact
			});
			Q.resolve(true).then(function() {
				self.postcardMenuView.postItemView.select();
			});
		});

		this.lobbyView.on('search:users', function(event) {
			self.contactRepository.searchChatUsers(event.text);
		});
		this.lobbyView.once('select:user', function(event) {
			var user = event.user;
			var options = event.options;
			
			self.chatRepository.setContact(user);
			self.dialogPostPageView.setContact(user);
			self.conversationView.switchMessageTape(user.get('id'));
			if (options !== 'persist') {
				self.mainMenuView.conversationItemView.setText(user.getFullName());
				self.mainMenuView.conversationItemView.select();
			}
			
			self.lobbyView.on('select-force:user', function(event) {
				var user = event.user;
				self.chatRepository.setContact(user);
				self.dialogPostPageView.setContact(user);
				self.conversationView.switchMessageTape(user.get('id'));
				self.mainMenuView.conversationItemView.setText(user.getFullName());
				self.mainMenuView.conversationItemView.select();
			});
		});
		
		this.answerPageView.on('click:answer', function(event) {
			self.prepareChatDialogView.show();
			self.currentDialogsWaitAsync().then(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.prepareChatDialogView.hide();
				self.lobbyView.selectUser(self.contactRepository.sender);
				self.lobbyView.trigger({
					type: 'select-force:user',
					user: self.contactRepository.sender
				});
				Q.resolve(true).then(function() {
					self.conversationView.hide();
					self.postcardView.show();
					self.postcardMenuView.showCancel();
					self.postcardMenuView.editItemView.select();
					self.postcardMenuView.editItemView.setText('2. Переделай по-своему!');
					self.postcardMenuView.postItemView.setText('3. Отправь в диалог!');
					self.currentPostClickHandler = self.chatPostClickHandler;
				});
			});
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
				self.errorDialogView.show();
				self.errorDialogView.setError(error);
				analytics.send('tape', 'msg_load_more', 'fail');
			});
		});
		this.selectPageView.on('click:preload', function(event) {
			self.messageStorage.appendPreloadedMessages();	
			analytics.send('tape', 'msg_load_new', 'success');
		});

		this.dialogPostPageView.on('click:send', function(event) {
			var account = self.contactRepository.owner;
			var companion = event.user;
			var content = self.editPageView.getMessageContent();

			companion.isAppUserAsync().then(function(isAppUser) {
				if (isAppUser) {
					self.trigger({
						type: 'click:send',
						text: content
					});
				} else {
					return self.messageSender.send(account, companion, content, true);
				}
			}).then(function() {
				self.postcardView.hide();
				self.conversationView.show();
			});
		});

		this.postPageView.on('click:send', function(event) {
			var account = self.contactRepository.owner;
			var companion = self.contactRepository.selected;
			var content = self.editPageView.getMessageContent();

			self.messageSender.send(account, companion, content, true);
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
			self.postcardMenuView.selectItemView.select();
			if (self.currentSkipAnswerAsync === self.requestedSkipAnswerAsync) {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.postPageView.friendSearchView.selectFriend(self.contactRepository.owner);
				self.postPageView.setMode('friend');
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
		this.cancelMessageUpdateDialogView.on('click:ok', function() {
			self.editPageView.reset();
		});
		this.inviteUserDialogView.on('click:ok', function() {
			VK.callMethod('showInviteBox');
		});
		this.createMessageDialogView.on('click:send', function() {
			analytics.send('dialog', 'text_send');
		});
		this.createMessageDialogView.on('click:send', function(event) {
			var toContact = self.chatRepository.contact;
			var fromContact = self.contactRepository.owner;
			var chatMessage = new messenger.data.ChatMessageModel();
			chatMessage.set({
				id: eye.uuid(),
				content: event.text,
				from: messenger.misc.Helper.buildVkId(fromContact),
				to: messenger.misc.Helper.buildVkId(toContact)
			});
			self.chatRepository.addMessage(chatMessage);
			self.chatClientWrapper.nowAsync().then(function(timestamp) {
				chatMessage.set('timestamp', timestamp);
				var rawMessage = MessageFactory.encode({
					id: chatMessage.get('id'),
					content: messenger.misc.Helper.normalizeMessageContent(chatMessage.get('content')),
					from: chatMessage.get('from'),
					to: chatMessage.get('to'),
					timestamp: chatMessage.get('timestamp')
				});
				return self.chatClientWrapper.sendMessageAsync(rawMessage);
			}).catch(function() {
				console.log(arguments);
			});
		});
		this.on('click:send', function(event) {
			var toContact = self.chatRepository.contact;
			var fromContact = self.contactRepository.owner;
			var chatMessage = new messenger.data.ChatMessageModel();
			chatMessage.set({
				id: eye.uuid(),
				content: event.text,
				from: messenger.misc.Helper.buildVkId(fromContact),
				to: messenger.misc.Helper.buildVkId(toContact)
			});
			self.chatRepository.addMessage(chatMessage);
			self.chatClientWrapper.nowAsync().then(function(timestamp) {
				chatMessage.set('timestamp', timestamp);
				var rawMessage = MessageFactory.encode({
					id: chatMessage.get('id'),
					content: messenger.misc.Helper.normalizeMessageContent(chatMessage.get('content')),
					from: chatMessage.get('from'),
					to: chatMessage.get('to'),
					timestamp: chatMessage.get('timestamp')
				});
				return Q.all([rawMessage, self.chatClientWrapper.sendMessageAsync(rawMessage)]);
			}).spread(function(rawMessage, response) {
				var shareMessageUrl = messenger.misc.Helper.calculateMessageShareUrl(rawMessage.id);
				return Q.all([rawMessage, messenger.misc.Helper.generatePreviewAsync(shareMessageUrl)]);
			}).spread(function(rawMessage, response) {
				chatMessage.set('preview', [messenger.Settings.imageStoreBaseUrl, response.image].join(''));
				rawMessage.preview = response.image;
				self.chatClient.notifyMessage(rawMessage);
				rawMessage.to = rawMessage.from;
				self.chatClient.notifyMessage(rawMessage, null, true);
			}).catch(function() {
				console.log(arguments);
			});
			analytics.send('dialog', 'card_send');
		});
		this.once('enable:dialogs', function() {
			console.log('enable');
			self.currentClickConversationHandler = self.standardClickConversationHandler;
			self.currentClickDialogHandler = self.standardClickDialogHandler;
			self.mainMenuView.enableChats();
		});
		this.once('complete:dialogs', function() {
			self.currentDialogsWaitAsync = self.successDialogsWaitAsync;
			self.mainMenuView.disableLoader();
		});
		this.once('fail:dialogs', function() {
			self.currentDialogsWaitAsync = self.failDialogsWaitAsync;
			self.mainMenuView.disableLoader();
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
		
		messenger.vk.initAsync().then(function() {
			return self.contactRepository.initializeAsync();
		}).then(function() {
			var owner = self.contactRepository.owner;
			var vkId = messenger.misc.Helper.buildVkId(owner);
			return self.chatClientWrapper.connectAndLoginAsync(vkId);
		}).then(function() {
			var owner = self.contactRepository.owner;
			var vkId = messenger.misc.Helper.buildVkId(owner);
			return self.chatRepository.loadSettingsAsync(vkId);
		}).then(function() {
			return self.messageStorage.loadMessagesAsync();
		}).then(function() {
			self.answerPageView.setContact(self.contactRepository.sender);
			self.answerPageView.setMessage(self.messageStorage.getSenderMessage());
			self.preloaderView.hide();
			self.chatRepository.loadTapeMessagesAsync().then(function() {
				self.contactRepository.searchChatUsers('');
				self.lobbyView.selectUser(self.chatRepository.getContact());
				self.initializeDialogs();
				self.trigger('complete:dialogs');
				analytics.send('dialog', 'dialog_success');
			}).catch(function(error) {
				self.trigger('fail:dialogs');
				analytics.send('dialog', 'dialog_fail', messenger.misc.Helper.formatError(error));
				console.log(error);
			});
			analytics.send('app_start', 'app_success');
		}).catch(function(error) {
			analytics.send('app_start', 'app_fail');
			console.error(error);
			alert('Приносим извенение. В настоящий момент в работе приложения наблюдаются проблемы. Возможно вы используете неподдерживаемый браузер. Установите Chrome, Opera, YaBrowser или Safari');
		});
	};
	MessengerApplication.prototype.initializeDialogs = function() {
		var self = this;
		var processInputMessage = function(rawMessage, soundNotification) {
			rawMessage.value = rawMessage.body;
			var chatMessage = ChatMessageModel.fromRaw(rawMessage);
			var chatMessageId = chatMessage.get('id');
			if (chatMessage.isValid() && !self.chatRepository.hasMessage(chatMessageId)) {
				self.chatRepository.addMessage(chatMessage);
				if (soundNotification) {
					self.newMessageSoundElem.play();
				}
			}
		};
		this.chatClient.on('message:sent', function(event) {
			var rawMessage = event.response.sent;
			processInputMessage(rawMessage);
		});
		this.chatClient.on('message:send', function(event) {
			var rawMessage = event.response.send;
			processInputMessage(rawMessage, true);
		});
		this.chatClient.on('message:notify', function(event) {
			var notify = event.response.notify;
			var body = notify.body;
			if (notify.id.indexOf('msg.') === 0) {
				do {
					var preview = body.preview;
					var id = body.id;
					if (!preview || !id) break;
					var message = self.chatRepository.getMessage(id);
					if (!message) break;
					message.set('preview', [messenger.Settings.imageStoreBaseUrl, preview].join(''));
				} while(false);
			}
		});
		this.chatClient.on('message:online', function(event) {
			var online = event.response.online;
			online.forEach(function(vkid) {
				var user = self.contactRepository.getChatUserByVkid(vkid);
				user.set('online', true);
			});
		});
		this.chatClient.online();
	};
	MessengerApplication.prototype.initializeMessageSender = function() {
		var self = this;

		this.messageSender.on('send:start', function(e) {
			if (e.modal) {
				self.postDialogView.show();
			}
		});
		this.messageSender.on('send:await-fail', function() {
			self.postDialogView.setMode('fail', {});
		});
		this.messageSender.on('send:create-message', function() {
			self.postDialogView.setText('Этап 2 из 6: Создание сообщения...');
		});
		this.messageSender.on('send:save-message', function() {
			self.postDialogView.setText('Этап 3 из 6: Сохранение сообщения...');
		});
		this.messageSender.on('send:create-preview', function() {
			self.postDialogView.setText('Этап 4 из 6: Создание превью...');
		});
		this.messageSender.on('send:save-preview', function(e) {
			self.postDialogView.setText('Этап 5 из 6: Сохранение превью в альбоме...');
			var chatMessage = self.chatRepository.getMessage(e.rawMessage.id);
			if (chatMessage) {
				chatMessage.set(
					'preview',
					[messenger.Settings.imageStoreBaseUrl, e.rawMessage.preview].join('')
				);
			}
		});
		this.messageSender.on('send:create-post', function(e) {
			var messageTarget = e.messageTarget;
			var receiver = e.receiver;

			self.postDialogView.setText('Этап 6 из 6: Публикация сообщения на стене...');

			if (messageTarget === MessageTargets.Friend) {
				self.postDialogView.hide();
				self.lobbyView.selectUser(receiver);
				self.lobbyView.trigger({
					type: 'select-force:user',
					user: receiver
				});
			}
		});
		this.messageSender.on('send:wall-closed', function(e) {
			var receiver = e.receiver;
			self.messageSender.invite(receiver);
			self.lobbyView.selectUser(receiver);
			self.lobbyView.trigger({
				type: 'select-force:user',
				user: receiver
			});
		});
		this.messageSender.on('send:complete', function(e) {
			var messageTarget = e.messageTarget;
			var receiver = e.receiver;
			if (messageTarget !== MessageTargets.Friend) {
				self.postDialogView.setMode('complete');
			}
			var destination = messenger.misc.Helper.messageTargetToString(messageTarget);
			analytics.send('post', ['post', destination].join('_'), 'success');
		});
		this.messageSender.on('send:fail', function(e) {
			var messageTarget = e.messageTarget;
			var error = e.error;
			var receiver = e.receiver;
			self.postDialogView.setMode('fail', error);
			if (error.errorCode === messenger.misc.ErrorCodes.RESTRICTED &&
				messageTarget === messenger.misc.MessageTargets.Friend) {
				self.lobbyView.selectUser(receiver);
				self.lobbyView.trigger({
					type: 'select-force:user',
					user: receiver
				});
			}
			var destination = messenger.misc.Helper.messageTargetToString(messageTarget);
			analytics.send('post', ['post', destination].join('_'), messenger.misc.Helper.formatError(error));
		});

		this.messageSender.on('invite:start', function() {
			self.postDialogView.hideDialog();
		});
		this.messageSender.on('invite:user', function() {
			self.inviteUserDialogView.show();
		});
		this.messageSender.on('invite:always', function() {
			self.postDialogView.show();
			self.postDialogView.setMode('fail', { errorCode: messenger.misc.ErrorCodes.RESTRICTED });
		});
		this.messageSender.on('invite:fail', function() {
			self.postDialogView.show();
			self.postDialogView.setMode('fail', { errorCode: messenger.misc.ErrorCodes.RESTRICTED });
		});
	};

	var messengerApplication = new MessengerApplication();
};