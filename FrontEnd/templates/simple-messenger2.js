window.onload = function() {
	
	var EventTrigger = mvp.EventTrigger;
	
	var ChatClient = chat.ChatClient;
	
	var ContactModel = chat.models.ContactModel;
	var MessageModel = chat.models.MessageModel;
	
	var ContactView = chat.views.ContactView;
	var AccountView = chat.views.AccountView;
	var MessageComposerView = chat.views.MessageComposerView;
	var ChatboxView = chat.views.ChatboxView;
	var DialogView = chat.views.DialogView;
	
	var formatDate = function(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var month = date.getMonth() + 1;
		var day = date.getDate();
		
		var now = new Date();
		var currentDay = now.getDate();
		var currentMonth = now.getMonth() + 1;
		
		var clock = [hours <= 9 ? '0' + hours : hours,
				minutes <= 9 ? '0' + minutes : minutes].join(':');
				
		if (currentDay !== day || currentMonth != month) {
			return [[month <= 9 ? '0' + month : month,
					day <= 9 ? '0' + day : day].join('.'), clock].join(' ');
		} else {
			return clock;
		}
	};
	
	var ChatApplication = function() {
		ChatApplication.super.constructor.apply(this, arguments);
		var self = this;
		
		this.serverUrl = 'ws://www.bazelevscontent.net:9009/';
		this.chatClient = new ChatClient(this.serverUrl);
		this.account = null;
		this.contact = null;
		
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
		
		this.contactModels = {};
		this.contactViews = {};
		
		this.messageModels = {};
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
		this.getMessagesBySender = function(senderId) {
			var keys = Object.keys(self.messages);
			var messages = keys.map(function(key) {
				return self.messages[key];
			}).filter(function(message) {
				return (message.value.from === senderId && !message.value.group) ||
						(message.value.to === senderId && !message.value.group) || 
						message.value.group === senderId;
			}).sort(function(message1, message2) {
				if (message1.value.timestamp > message2.value.timestamp) {
					return 1;
				} else if (message1.value.timestamp < message2.value.timestamp) {
					return -1;
				} else {
					return 0;
				}
			});
			return messages;
		};
		
		this.initialize = function() {
			this.chatboxView.attachTo(this.chatWrapElem);
			this.accountView.attachTo(this.menuElem);
			
			var authorizeListener = function(event) {
				console.log('authorize complete');
				
				self.chatClient.on('message:publiclist', publiclistClientChatListener);
				self.setAccount(event.account);
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
				var contactModelCollection = publics.map(ContactModel.fromPublic);

				contactModelCollection.forEach(function(contactModel) {
					var contactView = new ContactView(contactModel);
					var id = contactModel.getAttribute('id');
					self.contactModels[id] = contactModel;
					self.contactViews[id] = contactView;
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
				var contactModelCollection = themes.map(ContactModel.fromTheme);
				
				contactModelCollection.forEach(function(contactModel) {
					var contactView = new ContactView(contactModel);
					var id = contactModel.getAttribute('id');
					self.contactModels[id] = contactModel;
					self.contactViews[id] = contactView;
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
				var contactModelCollection = profiles.map(ContactModel.fromProfile);
				var accountId = self.account.getAttribute('id');
				
				contactModelCollection.forEach(function(contactModel) {
					var id = contactModel.getAttribute('id');
					self.contactModels[id] = contactModel;
					if (id !== accountId) {
						var contactView = new ContactView(contactModel);
						self.contactViews[id] = contactView;
					}
				});
				
				self.chatClient.online();
			};
			var onlineClientChatListener = function(event) {
				console.log('online complete');
				
				self.chatClient.off('message:online', onlineClientChatListener);
				self.chatClient.on('message:tape', tapeClientChatListener);
				
				var online = event.response.online;
				online.forEach(function(item) {
					var contactModel = self.contactModels[item];
					if (contactModel) {
						contactModel.setAttribute('online', true);
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
				var contactModel = self.contactModels[from];
				
				if (status.indexOf('online.') === 0) {
					contactModel.setAttribute('online', true);
				} else if (status.indexOf('offline.') === 0) {
					contactModel.setAttribute('online', false);
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
			
			var setAccountListener = function(event) {
				var account = event.account;
				var avatar = account.getAttribute('avatar');
				
				self.messageComposerView.setAvatar(avatar);
			};
			var unsetAccountListener = function(event) {
				self.messageComposerView.setAvatar('');
			};
			var setContactListener = function(event) {
				self.chatboxView.showMessageComposer(true);
				self.chatboxView.enableMessageComposer(true);
				self.chatboxView.showConversationTitle(true);
				self.updateConversationTitle();
			};
			var unsetContactListener = function(event) {
				self.chatboxView.showMessageComposer(false);
				self.chatboxView.enableMessageComposer(false);
				self.chatboxView.showConversationTitle(false);
				self.chatboxView.setConverstationTitle('');
			};
			
			this.on('set:account', setAccountListener);
			this.on('unset:account', unsetAccountListener);
			this.on('set:contact', setContactListener);
			this.on('unset:contact', unsetContactListener);
			
			var sendMessageComposerListener = function(event) {
				var messageModel = new MessageModel();
				
				messageModel.setAttribute('id', uuid.v4());
				messageModel.setAttribute('type', self.contact.getAttribute('type'));
				messageModel.setAttribute('authorId', self.account.getAttribute('id'));
				messageModel.setAttribute('receiverId', self.contact.getAttribute('id'));
				messageModel.setAttribute('content', event.content);
				
				console.log(JSON.stringify(messageModel, null, 4));
				
				self.sendMessage(messageModel);
			};
			
			this.messageComposerView.on('send', sendMessageComposerListener);
		};
	};
	ChatApplication.super = EventTrigger.prototype;
	ChatApplication.prototype = Object.create(EventTrigger.prototype);
	ChatApplication.prototype.constructor = ChatApplication;
	ChatApplication.prototype.setAccount = function(account) {
		if (this.account === null ||
			this.account.getAttribute('id') !== account.getAttribute('id')) {
			this.account = account;
			this.trigger({
				type: 'set:account',
				account: this.account
			}); 
		}
	};
	ChatApplication.prototype.unsetAccount = function() {
		this.account = null;
		this.trigger({
			type: 'unset:account'
		});
	};
	ChatApplication.prototype.setContact = function(contact) {
		if (this.contact === null ||
			this.contact.getAttribute('id') !== contact.getAttribute('id')) {
			this.contact = contact;
			this.trigger({
				type: 'set:contact',
				contact: this.contact
			});
		}	
	};
	ChatApplication.prototype.unsetContact = function() {
		this.contact = null;
		this.trigger({
			type: 'unset:contact'	
		});
	};
	ChatApplication.prototype.prepareContactViews = function() {
		var self = this;
		
		var prepareContactView = function(contactView) {
			contactView.attachTo(self.contactListElem);
			contactView.on('click', function(event) {
				self.setContact(event.model);
			});
		};

		var keys = Object.keys(this.contactViews);

		var publicKeys = keys.filter(function(key) {
			return self.contactModels[key].getAttribute('type') === 'public';
		});
		var themeKeys = keys.filter(function(key) {
			return self.contactModels[key].getAttribute('type') === 'theme';
		});
		var userKeys = keys.filter(function(key) {
			return self.contactModels[key].getAttribute('type') === 'user';
		});

		publicKeys.forEach(function(key) {
			prepareContactView(self.contactViews[key]);
		});
		themeKeys.forEach(function(key) {
			prepareContactView(self.contactViews[key]);
		});
		userKeys.forEach(function(key) {
			prepareContactView(self.contactViews[key]);
		});

		// var accountId = this.account.getAttribute('id');
		// var messageKeys = Object.keys(this.messages);

		// messageKeys.forEach(function(key) {
		// 	var message = self.messages[key];
		// 	var shown = message.shown;
		// 	var value = message.value || {};
		// 	var from = value.group || value.from || '';
		// 	if (!shown && from !== accountId) {
		// 		var contactModel = self.contactModels[from];
		// 		if (contactModel) {
		// 			var count = contactModel.getAttribute('count');
		// 			count += 1;
		// 			contactModel.setAttribute('count', count);
		// 		}
		// 	}
		// });
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
		
		var setThemeTitle = function() {
			var id = self.contact.getAttribute('id');
			var name = self.contact.getAttribute('name');
			var author = self.contact.getAttribute('author');
			var authorName = self.contactModels[author].getAttribute('name');
			var label = ['{', name, '}: '];
			var title = label.concat([authorName, ' and ...'].join(', ')).join('');

			var createGroupuserlistListener = function() {
				var groupuserlistListener = function(event) {
					self.chatClient.off("groupuserlist", groupuserlistListener);
					var groupuserlist = event.response.groupuserlist;
					var currentgroup = groupuserlist[0];
					var users = currentgroup.users || [];
					var userNames = users.map(function(user) {
						return self.contactModels[user].getAttribute('name');
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
			var title = self.contact.getAttribute('name');
			self.chatboxView.setConverstationTitle(title);
		};
		var setPublicTitle = function() {
			var name = self.contact.getAttribute('name');
			var author = self.contact.getAttribute('author');
			var authorName = [self.contactModels[author].getAttribute('name')];
			var moderators = Object.keys(self.contact.getAttribute('moderators'));
			var accountId = self.account.getAttribute('id');
			var userNames = moderators.filter(function(moderator) {
				return moderator !== accountId;
			}).map(function(moderator) {
				return self.contactModels[moderator].getAttribute('name');
			});
			var allUsers = authorName.concat(userNames).join(', ');
			var label = ['[', name, ']: '].join('');
			var title = [label, allUsers].join('');

			self.chatboxView.setConverstationTitle(title);
		};
		self.chatClient.off('message:groupuserlist');
		
		var type = self.contact.getAttribute('type');
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
		var self = this;
		
		this.unsetAccount(null);
		this.unsetContact(null);
		
		Object.keys(this.contactViews).forEach(function(key) {
			self.contactViews[key].dispose();
		});
		Object.keys(this.contactModels).forEach(function(key) {
			self.contactModels[key].dispose();
		});
		Object.keys(this.messageViews).forEach(function(key) {
			self.messageViews[key].dispose();
		});
		Object.keys(this.messageModels).forEach(function(key) {
			self.messageModels[key].dispose();	
		});
		
		this.contactViews = {};
		this.contactModels = {};
		this.messageViews = {};
		this.messageModels = {};
	};
	
	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};