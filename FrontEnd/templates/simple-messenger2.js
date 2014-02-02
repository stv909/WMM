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
		ChatApplication.super.constructor.apply(this, arguments);
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

		var messageElemHandler = function(e) {
			e.stopPropagation();
		};
		var documentElemHandler = function() {
			if (currentMessageElem) {
				checkMessageElemOverflow(currentMessageElem);
				endEditingMessageElem(currentMessageElem);
				enableMessageComposer();
				currentMessageElem = null;
			}
		};
		var beginEditingMessageElem = function(messageElem) {
			if (currentMessageElem !== null && currentMessageElem !== messageElem) {
				checkMessageElemOverflow(currentMessageElem);
				endEditingMessageElem(currentMessageElem);
			}

			var editElem = messageElem.getElementsByClassName('edit')[0];
			var clearElem = messageElem.getElementsByClassName('clear')[0];
			var cancelElem = messageElem.getElementsByClassName('cancel')[0];
			var shareElem = messageElem.getElementsByClassName('share')[0];
			var fullscreenElem = messageElem.getElementsByClassName('fullscreen')[0];
			var deleteElem = messageElem.getElementsByClassName('delete')[0];

			var containerElem = messageElem.getElementsByClassName('container')[0];
			var editorElem = messageElem.getElementsByClassName('editor')[0];

			editElem.textContent = 'finish';
			clearElem.style.display = 'block';
			cancelElem.style.display = 'block';
			shareElem.style.display = 'none';
			fullscreenElem.style.display = 'none';
			deleteElem.style.display = 'none';

			messageElem.className = 'message dynamic';
			containerElem.className = 'container dynamic';
			containerElem.style.overflow = 'scroll';
			containerElem.style.border = '2px solid #ddd';
			editorElem.contentEditable = 'true';

			currentMessageElem = messageElem;
			currentMessageContent = getMessageElemContent(currentMessageElem);
			messageElem.addEventListener('click', messageElemHandler);
		};
		var endEditingMessageElem = function(messageElem) {
			var editElem = messageElem.getElementsByClassName('edit')[0];
			var clearElem = messageElem.getElementsByClassName('clear')[0];
			var cancelElem = messageElem.getElementsByClassName('cancel')[0];
			var shareElem = messageElem.getElementsByClassName('share')[0];
			var fullscreenElem = messageElem.getElementsByClassName('fullscreen')[0];
			var deleteElem = messageElem.getElementsByClassName('delete')[0];

			var containerElem = messageElem.getElementsByClassName('container')[0];
			var editorElem = messageElem.getElementsByClassName('editor')[0];

			editElem.textContent = 'edit';
			clearElem.style.display = 'none';
			cancelElem.style.display = 'none';
			shareElem.style.display = 'block';
			fullscreenElem.style.display = 'block';
			deleteElem.style.display = 'block';

			messageElem.className = 'message static';
			containerElem.className = 'container static';
			containerElem.style.overflow = 'hidden';
			containerElem.scrollTop = 0;
			containerElem.scrollLeft = 0;
			editorElem.contentEditable = 'false';

			messageElem.removeEventListener('click', messageElemHandler);
			currentMessageElem = null;
			currentMessageContent = null;
		};
		var cancelEditingMessageElem = function(messageElem) {
			setMessageElemContent(messageElem, currentMessageContent);
		};
		
		var imbueStreamMessageElem = function(messageElem) {
			var deleteElem = messageElem.getElementsByClassName('delete')[0];
			var clearElem = messageElem.getElementsByClassName('clear')[0];
			var cancelElem = messageElem.getElementsByClassName('cancel')[0];
			var editElem = messageElem.getElementsByClassName('edit')[0];
			var fullscreenElem = messageElem.getElementsByClassName('fullscreen')[0];
			var shareElem = messageElem.getElementsByClassName('share')[0];
			var editorElem = messageElem.getElementsByClassName('editor')[0];

			var editElemHandler = function(e) {
				if (isEditingMessageElem(messageElem)) {
					checkMessageElemOverflow(messageElem);
					endEditingMessageElem(messageElem);
					enableMessageComposer();
				} else {
					beginEditingMessageElem(messageElem);
					disableMessageComposer();
				}
			};
			var clearElemHandler = function() {
				clearMessageElem(messageElem);
			};
			var cancelElemHandler = function() {
				cancelEditingMessageElem(messageElem);
				checkMessageElemOverflow(messageElem);
				endEditingMessageElem(messageElem);
				enableMessageComposer();
			};
			var fullscreenElemHandler = function() {
				var messageContent = getMessageElemContent(messageElem);
				showDialogElem(messageContent);
			};
			var shareElemHandler = function() {
				alert('Not implemented');
			};
			var deleteElemHandler = function() {
				editElem.removeEventListener('click', editElemHandler);
				clearElem.removeEventListener('click', clearElemHandler);
				cancelElem.removeEventListener('click', cancelElemHandler);
				fullscreenElem.removeEventListener('click', fullscreenElemHandler);
				shareElem.removeEventListener('click', shareElemHandler);
				editorElem.removeEventListener('keydown', editorElemKeydownHandler);
				editorElem.removeEventListener('keyup', editorElemKeyupHandler);
				editorElem.removeEventListener('blur', editorElemBlurHandler);
				deleteElem.removeEventListener('click', deleteElemHandler);
				streamWrapElem.removeChild(messageElem);
			};

			var enterCode = 13;
			var ctrlPressed = false;
			var shiftPressed = false;

			var editorElemKeydownHandler = function(e) {
				if (e.ctrlKey) {
					ctrlPressed = true;
				}
				if (e.shiftKey) {
					shiftPressed = true;
				}
				if (e.keyCode === enterCode && !shiftPressed && !ctrlPressed) {
					endEditingMessageElem(messageElem);
					checkMessageElemOverflow(messageElem);
					enableMessageComposer();
					e.preventDefault();
					e.stopPropagation();
				}
			};
			var editorElemKeyupHandler = function(e) {
				if (e.ctrlKey) {
					ctrlPressed = false;
				}
				if (e.shiftKey) {
					shiftPressed = false;
				}
			};
			var editorElemBlurHandler = function(e) {
				ctrlPressed = false;
				shiftPressed = false;
			};

			editElem.addEventListener('click', editElemHandler);
			clearElem.addEventListener('click', clearElemHandler);
			cancelElem.addEventListener('click', cancelElemHandler);
			fullscreenElem.addEventListener('click', fullscreenElemHandler);
			shareElem.addEventListener('click', shareElemHandler);
			editorElem.addEventListener('keydown', editorElemKeydownHandler);
			editorElem.addEventListener('keyup', editorElemKeyupHandler);
			editorElem.addEventListener('blur', editorElemBlurHandler);
			deleteElem.addEventListener('click', deleteElemHandler);

			checkMessageElemOverflow(messageElem);
		};

		var initializeComposerMessageElem = function() {
			document.addEventListener('click', documentElemHandler);
		};

		this.renderMessageElem = function(message) {
			self.currentMessages.push(message.id);
			var timestamp = message.value.timestamp;
			var now = new Date(timestamp);
			var time = formatDate(now);
			var from = message.value.from;
			var group = message.value.group;
			var contactModel = self.contactModels[from];
			var content = base64.decode(message.value.content);
			var author = contactModel.getAttribute('name');
			var avatar = contactModel.getAttribute('avatar');
			var messageElem = createMessageElem(content);
			
			if (message.shown) {
				messageElem.classList.remove('unshown'); 
			} else {
				messageElem.classList.add('unshown');
				var id = group || from;
				var mouseMoveListener = function(event) {
					message.shown = true;
					messageElem.removeEventListener('mousemove', mouseMoveListener);
					messageElem.classList.remove('unshown');
					var contactModel = self.contactModels[id];
					var count = contactModel.getAttribute('count');
					count--;
					contactModel.setAttribute('count', count);
					chatClient.shown(message.id);
				};
				messageElem.addEventListener('mousemove', mouseMoveListener);
			}
			
			imbueStreamMessageElem(messageElem);
			setMessageElemAuthor(messageElem, author);
			setMessageElemAvatar(messageElem, avatar);
			setMessageElemTime(messageElem, time);
			appendMessageElem(messageElem);
		};

		this.initialize = function() {
			this.chatboxView.attachTo(this.chatWrapElem);
			this.accountView.attachTo(this.menuElem);
			this.initializeStorageListeners();
			
			var authorizeListener = function(event) {
				console.log('authorize complete');
				
				self.chatClient.on('message:publiclist', publiclistClientChatListener);
				self.storage.setAccount(event.account);
				self.chatClient.publiclist();
			};
			var publiclistClientChatListener = function(event) {
				console.log('publiclist complete');
				
				self.chatClient.off('message:publiclist', publiclistClientChatListener);
				self.chatClient.on('message:retrieve', retrievePublicsClientChatListener);
				
				var publiclist = event.response.publiclist;
				var publicIdCollection = publiclist.map(function(public) {
					return public.id;
				});
				var publicIdCollectionString = publicIdCollection.join(',');
				
				console.log('public id collection');
				console.log(publicIdCollectionString);
				
				self.chatClient.retrieve(publicIdCollectionString);
			};
			var retrievePublicsClientChatListener = function(event) {
				console.log('public details complete');
				
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
				console.log('theme list complete');
				
				self.chatClient.off('message:subscribelist', subscribelistClientChatListener);
				self.chatClient.on('message:retrieve', retrieveThemesClientChatListener);
				
				var subscribelist = event.response.subscribelist;
				var themeIdCollection = subscribelist.filter(function(item) {
					return item.type !== 'public';	
				}).map(function(item) {
					return item.id;
				});
				var themeIdCollectionString = themeIdCollection.join(',');
				
				console.log('theme id collection');
				console.log(themeIdCollectionString);
				
				self.chatClient.retrieve(themeIdCollectionString);
			};
			var retrieveThemesClientChatListener = function(event) {
				console.log('theme details complete');
				
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
				
				console.log('profile id collection');
				console.log(profileIdCollectionString);
				
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
				
				var online = event.response.online;
				online.forEach(function(item) {
					var contact = self.storage.contacts[item];
					if (contact) {
						contact.setAttribute('online', true);
					}
				});
				
				console.log('online users');
				console.log(JSON.stringify(online, null, 4));
				
				self.chatClient.tape();
			};
			var tapeClientChatListener = function(event) {
				console.log('tape complete');
				
				self.chatClient.off('message:tape', tapeClientChatListener);
				self.chatClient.on('message:retrieve', retrieveMessagesClientChatListener);
				
				var tape = event.response.tape;
				var messageIdCollection = tape.map(function(item) {
					return item.id;	
				});
				var messageIdCollectionString = messageIdCollection.join(',');
				
				// tape.forEach(function(item) {
				// 	var message = { 
				// 		id: item.id, 
				// 		shown: item.shown
				// 	};
				// 	self.messages[item.id] = message;
				// });

				console.log('tape');
				console.log(JSON.stringify(tape, null, 4));
				console.log('message id collection');
				console.log(messageIdCollectionString);

				self.chatClient.retrieve(messageIdCollectionString);
			};
			var retrieveMessagesClientChatListener = function(event) {
				console.log('messages retrieve');
				
				self.chatClient.off('message:retrieve', retrieveMessagesClientChatListener);
				
				var messages = event.response.retrieve;
				// messages.forEach(function(message) {
				// 	self.messages[message.id].value = message.value;	
				// });
				// console.log(JSON.stringify(self.messages, null, 4));

				self.prepareContactViews();
				self.chatClient.on('message:send', sendChatClientListener);
				self.chatClient.on('message:sent', sentChatClientListener);
				self.chatClient.on('message:broadcast', broadcastChatClientListener);
			};
			
			var sendChatClientListener = function(event) {
				console.log('send');
				
				// var message = event.response.send;
				// message.value = message.body;
				// message.shown = false;
				// self.messages[message.id] = message;
				// newMessageSoundElem.play();
				
				// var from = message.value.from;
				// var group = message.value.group;
				// var id = group || from;
				// var contactModel = self.contactModels[id];
				// var count = contactModel.getAttribute('count');
				// count++;
				// contactModel.setAttribute('count', count);
				
				// if (self.currentContactModel !== null && 
				// 	(self.currentContactModel.getAttribute('id') === message.value.from || 
				// 	 self.currentContactModel.getAttribute('id') === message.value.group)) {
				// 	self.renderMessageElem(message);
				// 	html.scrollToBottom(streamWrapElem);
				// }
			};
			var sentChatClientListener = function(event) {
				console.log('sent');
				
				// var message = event.response.sent;
				// message.value = message.body;
				// message.shown = true;
				// self.messages[message.id] = message;
				
				// if (self.currentContactModel &&
				// 	message.value.to === self.currentContactModel.getAttribute('id') && 
				// 	self.currentMessages.indexOf(message.id) === -1) {
				// 	self.renderMessageElem(message);
				// 	html.scrollToBottom(streamWrapElem);
				// }
			};
			var broadcastChatClientListener = function(event) {
				console.log('broadcast');
				console.log(JSON.stringify(event.response.broadcast));
				
				var broadcast = event.response.broadcast;
				var from = broadcast.from;
				var status = broadcast.id;
				var contact = self.storage.contacts[from];
				
				if (status.indexOf('online.') === 0) {
					contact.setAttribute('online', true);
				} else if (status.indexOf('offline.') === 0) {
					contact.setAttribute('online', false);
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
				messageModel.setAttribute('shown', true);
				
				self.sendMessage(messageModel);
				self.storage.addMessage(messageModel);
			};
			
			this.messageComposerView.on('send', sendMessageComposerListener);
		};
	};
	ChatApplication.super = EventTrigger.prototype;
	ChatApplication.prototype = Object.create(EventTrigger.prototype);
	ChatApplication.prototype.constructor = ChatApplication;
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
			self.chatboxView.showMessageComposer(true);
			self.chatboxView.enableMessageComposer(true);
			self.chatboxView.showConversationTitle(true);
			self.updateConversationTitle();

			var oldMessages = event.oldMessages;
			var messages = event.messages;

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
					messageView = new MessageStreamView(message);
					self.messageViews[messageId] = messageView;
				}
				self.chatboxView.addMessageView(messageView);
			});
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
			var messageView = new MessageStreamView(message);
			self.messageViews[messageId] = messageView;
			self.chatboxView.addMessageView(messageView);
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
				return contacts[moderator].getAttribute('name');
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
	};

	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};