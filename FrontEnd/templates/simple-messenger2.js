window.onload = function() {
	
	var EventTrigger = mvp.EventTrigger;
	
	var ChatClient = chat.ChatClient;
	
	var ContactModel = chat.models.ContactModel;
	var MessageModel = chat.models.MessageModel;
	var Storage = chat.store.Storage;
	
	var ContactView = chat.views.ContactView;
	var AccountView = chat.views.AccountView;
	var MessageComposerView = chat.views.MessageComposerView;
	var MessageStreamView = chat.views.MessageStreamView;
	var ChatboxView = chat.views.ChatboxView;
	var DialogView = chat.views.DialogView;
	
	var ChatApplication = function() {
		ChatApplication.super.apply(this, arguments);
		var self = this;
		
		this.serverUrl = 'ws://www.bazelevscontent.net:9009/';
		this.chatClient = new ChatClient(this.serverUrl);
		this.storage = new Storage();
		
		this.chatElem = document.getElementById('chat');
		this.chatWrapElem = this.chatElem.getElementsByClassName('wrap')[0];
		this.menuElem = document.getElementById('menu');
		this.contactsElem = document.getElementById('contacts');
		this.contactWrapElem = this.contactsElem.getElementsByClassName('wrap')[0];
		this.contactListElem = this.contactWrapElem.getElementsByClassName('list')[0];
		this.newMessageSoundElem = document.getElementById('new-message-sound');
		
		this.accountView = new AccountView(this.chatClient);
		this.messageComposerView = new MessageComposerView();
		this.chatboxView = new ChatboxView(this.messageComposerView);
		this.dialogView = new DialogView();

		this.contactViews = {};
		this.messageViews = {};
		this.currentMessageView = null;

		this.initialize = function() {
			this.chatboxView.attachTo(this.chatWrapElem);
			this.accountView.attachTo(this.menuElem);
			this.initializeDocumentListeners();
			this.initializeStorageListeners();

			var tempRawMessages = {};
			var authorizeListener = function(event) {
				console.log('authorize complete');
				
				self.chatClient.on('message:publiclist', publiclistClientChatListener);
				self.storage.setAccount(event.account);
				self.chatClient.publiclist();
			};
			var publiclistClientChatListener = function(event) {
				//console.log('publiclist complete');
				
				self.chatClient.off('message:publiclist', publiclistClientChatListener);
				self.chatClient.on('message:retrieve', retrievePublicsClientChatListener);
				
				var publiclist = event.response.publiclist;
				var publicIdCollection = publiclist.map(function(public) {
					return public.id;
				});
				var publicIdCollectionString = publicIdCollection.join(',');
				
				//console.log('public id collection');
				//console.log(publicIdCollectionString);
				
				self.chatClient.retrieve(publicIdCollectionString);
			};
			var retrievePublicsClientChatListener = function(event) {
				//console.log('public details complete');
				
				self.chatClient.off('message:retrieve', retrievePublicsClientChatListener);
				self.chatClient.on('message:subscribelist', subscribelistClientChatListener);
				
				var publics = event.response.retrieve;
				var contactCollection = publics.map(ContactModel.fromPublic);
				contactCollection.forEach(function(contact) {
					self.storage.addContact(contact);
				});
				
				self.chatClient.subscribelist();
			};
			var subscribelistClientChatListener = function(event) {
				//console.log('theme list complete');
				
				self.chatClient.off('message:subscribelist', subscribelistClientChatListener);
				self.chatClient.on('message:retrieve', retrieveThemesClientChatListener);
				
				var subscribelist = event.response.subscribelist;
				var themeIdCollection = subscribelist.filter(function(item) {
					return item.type !== 'public';	
				}).map(function(item) {
					return item.id;
				});
				var themeIdCollectionString = themeIdCollection.join(',');
				
				//console.log('theme id collection');
				//console.log(themeIdCollectionString);
				
				self.chatClient.retrieve(themeIdCollectionString);
			};
			var retrieveThemesClientChatListener = function(event) {
				//console.log('theme details complete');
				
				self.chatClient.off('message:retrieve', retrieveThemesClientChatListener);
				self.chatClient.on('message:users', usersClientChatListener);
				
				var themes = event.response.retrieve;
				var contactCollection = themes.map(ContactModel.fromTheme);

				contactCollection.forEach(function(contact) {
					self.storage.addContact(contact);
				});
				
				self.chatClient.users();
			};
			var usersClientChatListener = function(event) {
				console.log('users complete');
				
				self.chatClient.off('message:users', usersClientChatListener);
				self.chatClient.on('message:retrieve', retrieveProfilesClientChatListener);
				
				var users = event.response.users;
				var profileIdCollection = users.map(function(user) {
					return ['profile', user].join('.');
				});
				var profileIdCollectionString = profileIdCollection.join(',');
				
				//console.log('profile id collection');
				//console.log(profileIdCollectionString);
				
				self.chatClient.retrieve(profileIdCollectionString);
			};
			var retrieveProfilesClientChatListener = function(event) {
				console.log('profile details complete');
				
				self.chatClient.off('message:retrieve', retrieveProfilesClientChatListener);
				self.chatClient.on('message:online', onlineClientChatListener);
				
				var profiles = event.response.retrieve;
				var contactCollection = profiles.map(ContactModel.fromProfile);

				contactCollection.forEach(function(contact) {
					self.storage.addContact(contact);
				});
				
				self.chatClient.online();
			};
			var onlineClientChatListener = function(event) {
				console.log('online complete');
				
				self.chatClient.off('message:online', onlineClientChatListener);
				self.chatClient.on('message:tape', tapeClientChatListener);

				var innerOnlineListener = function(event) {
					var contacts = self.storage.contacts;
					Object.keys(contacts).forEach(function(key) {
						var contact = contacts[key];
						var type = contact.getAttribute('type');
						if (type === 'user') {
							contact.setAttribute('online', false);
						}
					});

					var online = event.response.online;
					online.forEach(function(item) {
						var contact = self.storage.contacts[item];
						if (contact) {
							contact.setAttribute('online', true);
						}
					});
				};
				self.chatClient.on('message:online', innerOnlineListener);
				innerOnlineListener(event);

				//console.log('online users');
				//console.log(JSON.stringify(online, null, 4));
				
				self.chatClient.tape();
			};
			var tapeClientChatListener = function(event) {
				//console.log('tape complete');
				
				self.chatClient.off('message:tape', tapeClientChatListener);
				self.chatClient.on('message:retrieve', retrieveMessagesClientChatListener);
				
				var tape = event.response.tape;
				var messageIdCollection = tape.map(function(item) {
					return item.id;	
				});
				var messageIdCollectionString = messageIdCollection.join(',');
				tempRawMessages = {};
				tape.forEach(function(item) {
					var rawMessage = {
						id: item.id,
						shown: item.shown
					};
					tempRawMessages[item.id] = rawMessage;
				});

				//console.log('tape');
				//console.log(JSON.stringify(tape, null, 4));
				//console.log('message id collection');
				//console.log(messageIdCollectionString);

				self.chatClient.retrieve(messageIdCollectionString);
			};
			var retrieveMessagesClientChatListener = function(event) {
				//console.log('messages retrieve');
				
				self.chatClient.off('message:retrieve', retrieveMessagesClientChatListener);
				
				var rawMessages = event.response.retrieve;
				rawMessages.forEach(function(rawMessage) {
					var tempRawMessage = tempRawMessages[rawMessage.id];
					tempRawMessage.value = rawMessage.value;

					if (!tempRawMessage.value || !tempRawMessage.value.content) {
						return;
					}

					var message = MessageModel.fromRawMessage(tempRawMessage);
					var authorId = message.getAttribute('authorId');
					var author = self.storage.contacts[authorId];
					var receiver = self.storage.contacts[message.getAttribute('receiverId')];
					var accountId = self.storage.account.getAttribute('id');
					var own = authorId === accountId;

					if (receiver && author) {
						message.setAttribute('contact', author);
						message.setAttribute('receiver', receiver);
						message.setAttribute('type', receiver.getAttribute('type'));
						message.setAttribute('own', own);
						self.storage.addMessage(message);
					}
				});

				self.prepareContactViews();
				self.chatClient.on('message:send', sendChatClientListener);
				self.chatClient.on('message:sent', sentChatClientListener);
				self.chatClient.on('message:broadcast', broadcastChatClientListener);
			};
			
			var sendChatClientListener = function(event) {
				console.log('send');
				
				var rawMessage = event.response.send;
				rawMessage.value = rawMessage.body;
				rawMessage.shown = false;
				self.newMessageSoundElem.play();

				var message = MessageModel.fromRawMessage(rawMessage);

				var author = self.storage.contacts[message.getAttribute('authorId')];
				var receiver = self.storage.contacts[message.getAttribute('receiverId')];

				message.setAttribute('contact', author);
				message.setAttribute('receiver', receiver);
				message.setAttribute('type', receiver.getAttribute('type'));
				message.setAttribute('own', false);

				self.storage.addMessage(message);
			};
			var sentChatClientListener = function(event) {
				console.log('sent');
				
				var rawMessage = event.response.sent;
				rawMessage.value = rawMessage.body;
				rawMessage.shown = true;

				var messageId = rawMessage.value.id;
				var message = self.storage.messages[messageId];

				if (!message) {
					message = MessageModel.fromRawMessage(rawMessage);

					var author = self.storage.contacts[message.getAttribute('authorId')];
					var receiver = self.storage.contacts[message.getAttribute('receiverId')];

					message.setAttribute('contact', author);
					message.setAttribute('receiver', receiver);
					message.setAttribute('type', receiver.getAttribute('type'));
					message.setAttribute('own', true);

					self.storage.addMessage(message);
				}
			};
			var broadcastChatClientListener = function(event) {
				console.log('broadcast');
				console.log(JSON.stringify(event.response.broadcast));
				
				var broadcast = event.response.broadcast;
				var from = broadcast.from;
				var status = broadcast.id;
				var contact = self.storage.contacts[from];

				if (status.indexOf('online.') === 0) {
					self.chatClient.online();
				} else if (status.indexOf('offline.') === 0) {
					self.chatClient.online();
				} else if (status.indexOf('delete.msg.') === 0) {
					var messageId = status.replace('delete.msg.', '');
					if (self.storage.messages.hasOwnProperty(messageId)) {
						self.storage.removeMessage(messageId);
					}
				}
			};
			
			var disconnectListener = function(event) {
				self.chatClient.off('message:users');
				self.chatClient.off('message:publiclist');
				self.chatClient.off('message:retrieve');
				self.chatClient.off('message:subscribelist');
				self.chatClient.off('message:online');
				self.chatClient.off('message:tape');
				self.chatClient.off('message:groupuserlist');
				self.chatClient.off('message:sent');
				self.chatClient.off('message:send');
				self.chatClient.off('message:broadcast');
				self.chatClient.off('message:now');
				
				self.dispose();
			};
			var errorMessageClientChatListener = function(event) {
				alert('There\'s a terrible error on the server side. Call 911.');
			};

			this.accountView.on('authorize', authorizeListener);
			this.accountView.on('disconnect', disconnectListener);
			this.chatClient.on('error:message', errorMessageClientChatListener);

			var sendMessageComposerListener = function(event) {
				var companion = self.storage.companion;
				var account = self.storage.account;
				var messageModel = new MessageModel();
				
				messageModel.setAttribute('id', uuid.v4());
				messageModel.setAttribute('type', companion.getAttribute('type'));
				messageModel.setAttribute('authorId', account.getAttribute('id'));
				messageModel.setAttribute('receiverId', companion.getAttribute('id'));
				messageModel.setAttribute('content', event.content);
				messageModel.setAttribute('contact', account);
				messageModel.setAttribute('receiver', companion);
				messageModel.setAttribute('shown', true);
				messageModel.setAttribute('own', true);
				
				self.sendMessage(messageModel);
				self.storage.addMessage(messageModel);
			};
			
			this.messageComposerView.on('send', sendMessageComposerListener);
		};
	};
	ChatApplication.super = EventTrigger;
	ChatApplication.prototype = Object.create(EventTrigger.prototype);
	ChatApplication.prototype.constructor = ChatApplication;
	ChatApplication.prototype.initializeDocumentListeners = function() {
		var self = this;
		document.addEventListener('click', function(event) {
			if (self.currentMessageView) {
				self.currentMessageView.endEditing();
			}
		});
	};
	ChatApplication.prototype.initializeStorageListeners = function() {
		var self = this;

		var setAccountListener = function(event) {
			var account = event.account;
			var avatar = account.getAttribute('avatar');

			self.messageComposerView.setAvatar(avatar);
		};
		var unsetAccountListener = function(event) {
			self.messageComposerView.setAvatar('');
		};
		var setCompanionListener = function(event) {
			self.chatboxView.showConversationTitle(true);
			self.updateConversationTitle();

			var oldMessages = event.oldMessages;
			var messages = event.messages;
			var companion = event.companion;

			oldMessages.forEach(function(message) {
				var messageId = message.getAttribute('id');
				var messageView = self.messageViews[messageId];
				if (messageView) {
					messageView.detach();
				}
			});
			messages.forEach(function(message) {
				var messageId = message.getAttribute('id');
				var messageView = self.messageViews[messageId];
				if (!messageView) {
					messageView = self.createMessageView(message);
				}
				self.chatboxView.addMessageView(messageView);
			});

			var companionType = companion.getAttribute('type');
			var enableComposer = false;
			if (companionType !== 'user') {
				var author = companion.getAttribute('author');
				var moderators = companion.getAttribute('moderators');
				var accountId = self.storage.account.getAttribute('id');
				enableComposer = author === accountId || moderators[author];
			} else {
				enableComposer = true;
			}

			self.chatboxView.showMessageComposer(enableComposer);
			self.chatboxView.enableMessageComposer(enableComposer);
		};
		var unsetCompanionListener = function(event) {
			self.chatboxView.showMessageComposer(false);
			self.chatboxView.enableMessageComposer(false);
			self.chatboxView.showConversationTitle(false);
			self.chatboxView.setConverstationTitle('');
		};
		var addContactListener = function(event) {
			var contact = event.contact;
			var contactId = contact.getAttribute('id');
			var accountId = self.storage.account.getAttribute('id');

			if (contactId !== accountId) {
				var contactView = new ContactView(contact);
				self.contactViews[contactId] = contactView;
			}
		};
		var removeContactListener = function(event) {
			var contactId = event.contactId;
			var contactView = self.contactViews[contactId];

			if (contactView) {
				contactView.dispose();
				delete self.contactViews[contactId];
			}
		};
		var addMessageListener = function(event) {
			var message = event.message;
			var messageId = message.getAttribute('id');
			var authorId = message.getAttribute('authorId');
			var receiverId = message.getAttribute('receiverId');

			var shownListener = function(event) {
				self.chatClient.shown(['msg', messageId].join('.'));
			};
			message.on('change:shown', shownListener);

			if (self.storage.companion) {
				var companion = self.storage.companion;
				var companionId = companion.getAttribute('id');
				if (authorId === companionId || receiverId == companionId) {
					var messageView = self.createMessageView(message);
					self.chatboxView.addMessageView(messageView);
				}
			}
		};
		var removeMessageListener = function(event) {
			var messageId = event.messageId;
			var messageView = self.messageViews[messageId];

			if (messageView) {
				messageView.dispose();
				delete self.messageViews[messageId];
			}
		};

		this.storage.on('set:account', setAccountListener);
		this.storage.on('unset:account', unsetAccountListener);
		this.storage.on('set:companion', setCompanionListener);
		this.storage.on('unset:companion', unsetCompanionListener);
		this.storage.on('add:contact', addContactListener);
		this.storage.on('remove:contact', removeContactListener);
		this.storage.on('add:message', addMessageListener);
		this.storage.on('remove:message', removeMessageListener);
	};
	ChatApplication.prototype.createMessageView = function(message) {
		var self = this;
		var messageElemListener = function(event) {
			event.stopPropagation();
		};

		var messageId = message.getAttribute('id');
		var messageView = new MessageStreamView(message);

		var fullscreenClickListener = function(event) {
			var model = event.model;
			var content = model.getAttribute('content');
			self.dialogView.show(content);
		};
		var deleteClickListener = function(event) {
			var message = event.model;
			var messageId = message.getAttribute('id');
			var msgId = ['msg', messageId].join('.');
			var deleteBroadcast = ['delete', msgId].join('.');

			self.storage.removeMessage(messageId);
			self.chatClient.remove(msgId);
			self.chatClient.broadcast(deleteBroadcast);
		};
		var editingBeginListener = function(event) {
			if (self.currentMessageView !== null && self.currentMessageView !== messageView) {
				self.currentMessageView.endEditing();
			}
			messageView.elem.addEventListener('click', messageElemListener);
			self.chatboxView.enableMessageComposer(false);
			self.currentMessageView = messageView;
		};
		var editingEndListener = function(event) {
			messageView.elem.removeEventListener('click', messageElemListener);
			self.chatboxView.enableMessageComposer(true);
			self.currentMessageView = null;
		};
		var editingCancelListener = function(event) {
			messageView.elem.removeEventListener('click', messageElemListener);
			self.chatboxView.enableMessageComposer(true);
			self.currentMessageView = null;
		};

		messageView.on('click:fullscreen', fullscreenClickListener);
		messageView.on('click:delete', deleteClickListener);
		messageView.on('editing:begin', editingBeginListener);
		messageView.on('editing:end', editingEndListener);
		messageView.on('editing:cancel', editingCancelListener);

		this.messageViews[messageId] = messageView;

		return messageView;
	};
	ChatApplication.prototype.prepareContactViews = function() {
		var self = this;
		
		var prepareContactView = function(contactView) {
			contactView.attachTo(self.contactListElem);
			contactView.on('click', function(event) {
				self.storage.setCompanion(event.model);
			});
		};

		var publicKeys = self.storage.getPublicContactIds();
		var themeKeys = self.storage.getThemeContactIds();
		var userKeys = self.storage.getUserContactIds();

		publicKeys.forEach(function(key) {
			prepareContactView(self.contactViews[key]);
		});
		themeKeys.forEach(function(key) {
			prepareContactView(self.contactViews[key]);
		});
		userKeys.forEach(function(key) {
			prepareContactView(self.contactViews[key]);
		});
	};
	ChatApplication.prototype.sendMessage = function(messageModel) {
		var self = this;
		var nowChatClientListener = function(event) {
			self.chatClient.off('message:now', nowChatClientListener);
			messageModel.setAttribute('timestamp', event.response.now);
			
			var rawMessage = messageModel.toRawMessage();
			var type = messageModel.getAttribute('type');
			
			switch (type) {
				case 'user':
					self.chatClient.sendMessage(rawMessage);
					break;
				default:
					self.chatClient.sendMessage(rawMessage, type);
					break;
			}
		};
		self.chatClient.on('message:now', nowChatClientListener);
		self.chatClient.now();
	};
	ChatApplication.prototype.updateConversationTitle = function() {
		var self = this;
		var storage = self.storage;
		var companion = storage.companion;
		var account = storage.account;
		var contacts = storage.contacts;

		var setThemeTitle = function() {
			var id = companion.getAttribute('id');
			var name = companion.getAttribute('name');
			var author = companion.getAttribute('author');
			var authorName = contacts[author].getAttribute('name');
			var label = ['{', name, '}: '];
			var title = label.concat([authorName, ' and ...'].join(', ')).join('');

			var createGroupuserlistListener = function() {
				var groupuserlistListener = function(event) {
					self.chatClient.off("groupuserlist", groupuserlistListener);
					var groupuserlist = event.response.groupuserlist;
					var currentgroup = groupuserlist[0];
					var users = currentgroup.users || [];
					var userNames = users.map(function(user) {
						return contacts[user].getAttribute('name');
					});
					var title = label.concat(userNames.join(', ')).join('');
					self.chatboxView.setConverstationTitle(title);
				};
				return groupuserlistListener;
			};

			self.chatClient.on('message:groupuserlist', createGroupuserlistListener());
			self.chatClient.groupuserlist(['theme', id].join('.'));

			self.chatboxView.setConverstationTitle(title);
		};
		var setUserTitle = function() {
			var title = companion.getAttribute('name');
			self.chatboxView.setConverstationTitle(title);
		};
		var setPublicTitle = function() {
			var name = companion.getAttribute('name');
			var author = companion.getAttribute('author');
			var authorName = [contacts[author].getAttribute('name')];
			var moderators = Object.keys(companion.getAttribute('moderators'));
			var accountId = account.getAttribute('id');
			var userNames = moderators.filter(function(moderator) {
				return moderator !== accountId;
			}).map(function(moderator) {
				var contact = contacts[moderator];
				if (contact) {
					return contact.getAttribute('name');
				} else {
					return '';
				}
			});
			var allUsers = authorName.concat(userNames).join(', ');
			var label = ['[', name, ']: '].join('');
			var title = [label, allUsers].join('');

			self.chatboxView.setConverstationTitle(title);
		};
		self.chatClient.off('message:groupuserlist');
		
		var type = companion.getAttribute('type');
		switch (type) {
			case 'user':
				setUserTitle();
				break;
			case 'public':
				setPublicTitle();
				break;
			case 'theme':
				setThemeTitle();
				break;
		}
	};
	ChatApplication.prototype.dispose = function() {
		this.storage.clear();
		this.currentMessageView = null;
	};

	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};