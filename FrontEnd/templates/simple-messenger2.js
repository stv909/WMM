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
		
		var serverUrl = 'ws://www.bazelevscontent.net:9009/';
		var chatClient = new ChatClient(serverUrl);
		
		this.chatClient = chatClient;
		this.account = null;
		this.contact = null;
		
		this.chatElem = document.getElementById('chat');
		this.chatWrapElem = this.chatElem.getElementsByClassName('wrap')[0];
		this.menuElem = document.getElementById('menu');
		this.contactsElem = document.getElementById('contacts');
		this.contactWrapElem = this.contactsElem.getElementsByClassName('wrap')[0];
		this.contactListElem = this.contactWrapElem.getElementsByClassName('list')[0];
		
		this.accountView = new AccountView(chatClient);
		this.messageComposerView = new MessageComposerView();
		this.chatboxView = new ChatboxView(this.messageComposerView);
		this.dialogView = new DialogView();

		var composerElem = document.getElementById('composer');
		var newMessageSoundElem = document.getElementById('new-message-sound');
		
		var userId = null;
		
		this.contactModels = {};
		this.contactViews = {};

		this.messages = {};
		this.currentMessages = [];
		this.currentContactModel = null;
		this.setChatContactModel = function(contactModel) {
			if (self.currentContactModel === null || 
				self.currentContactModel.getAttribute('id') !== contactModel.getAttribute('id')) {
					
				var setThemeChat = function() {
					var id = self.currentContactModel.getAttribute('id');
					var name = self.currentContactModel.getAttribute('name');
					var author = self.currentContactModel.getAttribute('author');
					var authorName = self.contactModels[author].getAttribute('name');
					var label = ['{', name, '}: '];
					
					var createGroupuserlistListener = function() {
						var groupuserlistListener = function(event) {
							var groupuserlist = event.response.groupuserlist;
							var currentgroup = groupuserlist[0];
							var users = currentgroup.users || [];
							var userNames = users.map(function(user) {
								return self.contactModels[user].getAttribute('name');	
							});
							var title = label.concat(userNames.join(', ')).join('');
							updateConversationTitle(title);
							chatClient.off("groupuserlist", groupuserlistListener);
						};
						return groupuserlistListener;
					};
					
					chatClient.on('message:groupuserlist', createGroupuserlistListener());
					chatClient.groupuserlist(['theme', id].join('.'));
			
					var title = label.concat([authorName, ' and ...'].join(', ')).join('');
					updateConversationTitle(title);
					showConversationTitle(true);
				};
				var setUserChat = function() {
					var title = self.currentContactModel.getAttribute('name');
					updateConversationTitle(title);
					showConversationTitle(true);
				};
				var setPublicChat = function() {
					var name = self.currentContactModel.getAttribute('name');
					var author = self.currentContactModel.getAttribute('author');
					var authorName = [self.contactModels[author].getAttribute('name')];
					var moderators = Object.keys(self.currentContactModel.getAttribute('moderators'));
					var userNames = moderators.filter(function(moderator) {
						return moderator !== userId;	
					}).map(function(moderator) {
						return self.contactModels[moderator].getAttribute('name');
					});
					var allUsers = authorName.concat(userNames).join(', ');
					var label = ['[', name, ']: '].join('');
					var title = [label, allUsers].join('');
 
					updateConversationTitle(title);
					showConversationTitle(true);
				};
				
				self.currentContactModel = contactModel;
				chatClient.off('message:grouplist');
				deleteAllMessageElems();
				showComposer(true);
				
				var type = self.currentContactModel.getAttribute('type');
				switch(type) {
					case 'user':
						setUserChat();
						break;
					case 'public':
						setPublicChat();
						break;
					case 'theme':
						setThemeChat();
						break;
				}
				
				var messages = self.getMessagesBySender(self.currentContactModel.getAttribute('id'));
				messages.forEach(function(message) {
					self.renderMessageElem(message);	
				});
				html.scrollToBottom(streamWrapElem);
			}
		};
		
		var createMessageElem = function(content) {
			var messageElem = createTemplateElem('message');
			var editorElem = messageElem.getElementsByClassName('editor')[0];
			editorElem.innerHTML = content;
			return messageElem;
		};
		var deleteAllMessageElems = function() {
			streamWrapElem.innerHTML = '';
			self.currentMessages = [];
		};
		
		var currentMessageElem = null;
		var currentMessageContent = null;
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
		var appendMessageElem = function(messageElem) {
			streamWrapElem.appendChild(messageElem);
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
			var messageElem = composerElem.getElementsByClassName('message')[0];
			imbueComposerMessageElem(messageElem);
			document.addEventListener('click', documentElemHandler);
		};

		var sendMessage = function(content, now, msgId) {
			var type = self.currentContactModel.getAttribute('type');
			var id = self.currentContactModel.getAttribute('id');
			var message = chat.MessageFactory.create(
				msgId || uuid.v4(),
				content,
				userId,
				id,
				now
			);
			
			if (type === 'public' || type === 'theme') {
				message.group = id;
				message.to = '%recipientid%';
			}

			switch(type) {
				case 'user':
					chatClient.sendMessage(message);
					break;
				case 'public':
					chatClient.sendMessage(message, type);
					break;
				case 'theme':
					chatClient.sendMessage(message, type);
					break;
			}
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
		
		this.dispose = function() {
			var keys = Object.keys(self.contactViews);
			keys.forEach(function(key) {
				self.contactViews[key].dispose();
				self.contactModels[key].off();
			});
			self.contactViews = {};
			self.contactModels = {};
			self.currentContactModel = null;
			self.messages = {};
			
			deleteAllMessageElems();
		};
		
		
		this.initialize = function() {
			this.chatboxView.attachTo(this.chatWrapElem);
			this.accountView.attachTo(this.menuElem);
			
			var self = this;
			var authorizeListener = function(event) {
				console.log('authorize complete');
				
				self.chatClient.on('message:publiclist', publiclistClientChatListener);
				
				self.setAccount(event.account);
				self.chatboxView.showMessageComposer(true);
				self.chatboxView.enableMessageComposer(true);
				
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
				
				contactModelCollection.forEach(function(contactModel) {
					var id = contactModel.getAttribute('id');
					self.contactModels[id] = contactModel;
					if (id !== userId) {
						var contactView = new ContactView(contactModel);
						self.contactViews[id] = contactView;
					}
				});
				
				chatClient.online();
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
				
				tape.forEach(function(item) {
					var message = { 
						id: item.id, 
						shown: item.shown
					};
					self.messages[item.id] = message;
				});

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
				messages.forEach(function(message) {
					self.messages[message.id].value = message.value;	
				});
				console.log(JSON.stringify(self.messages, null, 4));

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
				chatClient.off('message:users');
				chatClient.off('message:publiclist');
				chatClient.off('message:retrieve');
				chatClient.off('message:subscribelist');
				chatClient.off('message:online');
				chatClient.off('message:tape');
				chatClient.off('message:groupuserlist');
				chatClient.off('message:sent');
				chatClient.off('message:send');
				chatClient.off('message:broadcast');
				chatClient.off('message:now');
				
				self.dispose();
			};
			var errorMessageClientChatListener = function(event) {
				alert('There\'s a terrible error on the server side. Call 911.');
			};

			this.accountView.on('authorize', authorizeListener);
			//this.accountView.on('disconnect', disconnectListener);
			chatClient.on('error:message', errorMessageClientChatListener);
			
			
			var changeAccountListener = function(event) {
				var account = event.account;
				if (account) {
					var avatar = account.getAttribute('avatar');
					self.messageComposerView.setAvatar(avatar);
				} else {
					self.messageComposerView.setAvatar('');
				}
			};
			var changeContactListener = function(event) {
				var contact = event.contact;
				if (contact) {
					alert(JSON.stringify(contact, null, 4));	
				} else {
					self.chatboxView.enableMessageComposer(false);
					self.chatboxView.showMessageComposer(false);
					self.chatboxView.showConversationTitle(false);
				}
			};
			
			this.on('change:account', changeAccountListener);
			this.on('change:contact', changeContactListener);
			
			var sendMessageComposerListener = function(event) {
				alert(event.content);	
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
				type: 'change:account',
				account: this.account
			}); 
		}
	};
	ChatApplication.prototype.setContact = function(contact) {
		if (this.contact === null ||
			this.contact.getAttribute('id') !== contact.getAttribute('id')) {
			this.contact = contact;
			this.trigger({
				type: 'change:contact',
				contact: this.contact
			});
		}	
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

		var accountId = this.account.getAttribute('id');
		var messageKeys = Object.keys(this.messages);

		messageKeys.forEach(function(key) {
			var message = self.messages[key];
			var shown = message.shown;
			var value = message.value || {};
			var from = value.group || value.from || '';
			if (!shown && from !== accountId) {
				var contactModel = self.contactModels[from];
				if (contactModel) {
					var count = contactModel.getAttribute('count');
					count += 1;
					contactModel.setAttribute('count', count);
				}
			}
		});
	};
	
	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};