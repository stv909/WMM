window.onload = function() {
	
	var EventEmitter = chat.EventEmitter;
	var ChatClient = chat.ChatClient;
	
	var createTemplateElem = function(className) {
		var templatesElem = document.getElementById('template');
		var templateElem = templatesElem.getElementsByClassName(className)[0];
		var newTemplateElem = templateElem.cloneNode(true);
		return newTemplateElem;
	};
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
	
	var ContactView = function(model) {
		var self = this;
		mvp.EventTrigger.call(this);

		this.rootElem = null;
		this.model = model;
		this.contactElem = template.create('contact-template', { className: 'contact' });

		this.avatarElem = this.contactElem.getElementsByClassName('avatar')[0];
		this.nameElem = this.contactElem.getElementsByClassName('name')[0];
		this.countElem = this.contactElem.getElementsByClassName('count')[0];
		
		// model listeners
		var modelAvatarListener = function(event) {
			self.avatarElem.src = event.value;	
		};
		var modelNameListener = function(event) {
			var leftBrace = '';
			var rightBrace = '';
			
			switch(self.model.getAttribute('type')) {
				case 'public':
					leftBrace = '[';
					rightBrace = ']';
					break;
				case 'theme':
					leftBrace = '{';
					rightBrace = '}';
					break;
			}
			self.nameElem.textContent = [leftBrace, event.value, rightBrace].join('');
		};
		var modelCountListener = function(event) {
			var count = event.value;
			self.countElem.textContent = ['+', count].join('');
			if (count > 0) {
				self.countElem.classList.remove('hidden');
			} else {
				self.countElem.classList.add('hidden');
			}
		};
		var modelOnlineListener = function(event) {
			var online = event.value;
			if (online) {
				self.contactElem.classList.remove('offline');
			} else {
				self.contactElem.classList.add('offline');
			}
		};
		
		this.model.on('change:avatar', modelAvatarListener);
		this.model.on('change:name', modelNameListener);
		this.model.on('change:count', modelCountListener);
		this.model.on('change:online', modelOnlineListener);
		
		// elems listeners
		var contactElemClickListener = function(event) {
			self.trigger({
				type: 'click',
				model: model	
			});	
		};
		
		this.contactElem.addEventListener('click', contactElemClickListener);
		
		// dispose block
		var disposeListener = function(event) {
			self.off();	
			self.model.off('change:avatar', modelAvatarListener);
			self.model.off('change:name', modelNameListener);
			self.model.off('change:count', modelCountListener);
			self.model.off('change:online', modelOnlineListener);
			self.contactElem.removeEventListener('click', contactElemClickListener);
		};
		
		this.on('dispose', disposeListener);
		
		// init ui
		this.contactElem.title = model.getAttribute('id');
		this.contactElem.classList.add(model.getAttribute('type'));
		modelOnlineListener({ value: model.getAttribute('online') });
		modelNameListener({ value: model.getAttribute('name') });
		modelAvatarListener({ value: model.getAttribute('avatar') });
		modelCountListener({ value: model.getAttribute('count') });
	};
	ContactView.prototype = Object.create(mvp.EventTrigger.prototype);
	ContactView.prototype.constructor = ContactView;
	ContactView.prototype.getModel = function() {
		return this._model;	
	};
	ContactView.prototype.attachTo = function(rootElem) {
		if (!this.rootElem) {
			this.rootElem = rootElem;
			this.rootElem.appendChild(this.contactElem);
		}
	};
	ContactView.prototype.dettach = function() {
		if (this.rootElem) {
			this.rootElem.removeChild(this.contactElem);
			this.rootElem = null;
		}
	};
	ContactView.prototype.dispose = function() {
		this.trigger('dispose');
		this.dettach();
	};
	
	var ContactModelFactory = function() { };
	ContactModelFactory.create = function(id, name, avatar, type, online, count) {
		var contactModel = new mvp.Model();
		
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('avatar', avatar);
		contactModel.setAttribute('type', type);
		contactModel.setAttribute('online', online);
		contactModel.setAttribute('count', count);
		
		return contactModel;
	};
	ContactModelFactory.fromPublic = function(public) {
		var value = public.value || {};
					
		var id = public.id.replace('public.', '');
		var name = value.label || id;
		var author = value.auther || '';
		var moderators = value.moderators || {};
					
		var contactModel = new mvp.Model();
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('type', 'public');
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('online', true);
		contactModel.setAttribute('count', 0);
		contactModel.setAttribute('avatar', 'https://cdn3.iconfinder.com/data/icons/linecons-free-vector-icons-pack/32/world-512.png');
		contactModel.setAttribute('author', author);
		contactModel.setAttribute('moderators', moderators);
		
		return contactModel;
	};
	ContactModelFactory.fromTheme = function(theme) {
		var value = theme.value || {};
		
		var id = theme.id.replace('theme.', '');
		var name = value.label || id;
		var author = value.auther || '';
		
		var contactModel = new mvp.Model();
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('type', 'theme');
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('online', true);
		contactModel.setAttribute('count', 0);
		contactModel.setAttribute('avatar', 'http://simpleicon.com/wp-content/uploads/group-1.png');
		contactModel.setAttribute('author', author);
		
		return contactModel;
	};
	ContactModelFactory.fromProfile = function(profile) {
		var value = profile.value || {};
		
		var id = profile.id.replace('profile.', '');
		var name = value.nickname || id;
		var avatar = value.avatar || 'http://simpleicon.com/wp-content/uploads/business-man-1.png';
		
		var contactModel = new mvp.Model();
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('type', 'user');
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('online', false);
		contactModel.setAttribute('count', 0);
		contactModel.setAttribute('avatar', avatar);
		
		return contactModel;
	};
	
	var ChatApplication = function() {
		var self = this;
		
		var serverUrl = 'ws://www.bazelevscontent.net:9009/';
		var chatClient = new ChatClient(serverUrl);

		var pageElem = document.getElementById('page');
		var dialogElem = document.getElementById('dialog');
		var menuElem = document.getElementById('menu');
		var contactsElem = document.getElementById('contacts');
		var contactWrapElem = contactsElem.getElementsByClassName('wrap')[0];
		var contactListElem = contactWrapElem.getElementsByClassName('list')[0];
		var composerElem = document.getElementById('composer');
		var composerAvatarImgElem = composerElem
			.getElementsByClassName('avatar')[0]
			.getElementsByClassName('image')[0]
			.getElementsByTagName('img')[0];
		var streamElem = document.getElementById('stream');
		var streamWrapElem = streamElem.getElementsByClassName('wrap')[0];
		var newMessageSoundElem = document.getElementById('new-message-sound');
		
		var userId = null;
		
		this.contactModels = {};
		this.contactViews = {};

		var updateConversationTitle = function(title) {
			var conversationElem = document.getElementById('conversation');
			var wrapElem = conversationElem.getElementsByClassName('wrap')[0];
			
			wrapElem.textContent = title;
		};
		var showConversationTitle = function(isVisible) {
			var conversationElem = document.getElementById('conversation');
			if (isVisible) {
				conversationElem.classList.remove('passive');
			} else {
				conversationElem.classList.add('passive');
			}
		};
		
		var showComposer = function(isVisible) {
			if (isVisible) {
				composerElem.classList.remove('passive');
			} else {
				composerElem.classList.add('passive');
				composerAvatarImgElem.src = 'http://www.dangerouscreation.com/wp-content/uploads/2012/11/blank_avatar.jpg';
			}
		};
		
		this.messages = {};
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
		
		var clearMessageElem = function(messageElem) {
			var editorElem = messageElem.getElementsByClassName('editor')[0];
			editorElem.innerHTML = '';
		};
		var getMessageElemContent = function(messageElem) {
			var editor = messageElem.getElementsByClassName('editor')[0];
			return editor.innerHTML;
		};
		var setMessageElemContent = function(messageElem, content) {
			var editorElem = messageElem.getElementsByClassName('editor')[0];
			editorElem.innerHTML = content;
		};
		var setMessageElemAuthor = function(messageElem, author) {
			var nameElem = messageElem.getElementsByClassName('name')[0];
			nameElem.textContent = author;
		};
		var setMessageElemAvatar = function(messageElem, avatar) {
			var avatarElem = messageElem.getElementsByClassName('avatar')[0];
			var avatarImgElem = avatarElem.getElementsByTagName('img')[0];
			avatarImgElem.src = avatar;
		};
		var setMessageElemTime = function(messageElem, time) {
			var timeElem = messageElem.getElementsByClassName('time')[0];
			timeElem.textContent = time;
		};
		var checkMessageElemOverflow = function(messageElem) {
			var containerElem = messageElem.getElementsByClassName('container')[0];
			var isOverflow = html.checkElemOverflow(containerElem);
			if (isOverflow) {
				containerElem.style.border = '2px solid #fffc63';
			}
			else {
				containerElem.style.border = '2px solid #fff';
			}
		};
		var isEditingMessageElem = function(messageElem) {
			var containerElems = messageElem.getElementsByClassName('container dynamic');
			return containerElems.length !== 0;
		};
		var createMessageElem = function(content) {
			var messageElem = createTemplateElem('message');
			var editorElem = messageElem.getElementsByClassName('editor')[0];
			editorElem.innerHTML = content;
			return messageElem;
		};
		var deleteAllMessageElems = function() {
			streamWrapElem.innerHTML = '';
		};
		var deleteAllMessages = function() {
			_messages = [];	
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
		var disableMessageComposer = function() {
			var messageElem = composerElem.getElementsByClassName('message')[0];
			var container = messageElem.getElementsByClassName('container')[0];
			var editorElem = messageElem.getElementsByClassName('editor')[0];
			composerElem.className = 'composer static';
			messageElem.className = 'message static';
			container.className = 'container static';
			editorElem.contentEditable = 'false';
		};
		var enableMessageComposer = function() {
			var messageElem = composerElem.getElementsByClassName('message')[0];
			var container = messageElem.getElementsByClassName('container')[0];
			var editorElem = messageElem.getElementsByClassName('editor')[0];
			composerElem.className = 'composer dynamic';
			messageElem.className = 'message dynamic';
			container.className = 'container dynamic';
			editorElem.contentEditable = 'true';
		};
		var appendMessageElem = function(messageElem) {
			streamWrapElem.appendChild(messageElem);
		};
		var showDialogElem = function(content) {
			pageElem.className = 'passive';
			dialogElem.className = 'active';

			var contentElem = dialogElem.getElementsByClassName('content')[0];
			contentElem.innerHTML = content;
		};
		var hideDialogElem = function() {
			pageElem.className = 'active';
			dialogElem.className = 'passive';

			var contentElem = dialogElem.getElementsByClassName('content')[0];
			contentElem.innerHTML = '';
			contentElem.scrollLeft = 0;
			contentElem.scrollTop = 0;
		};
		var initializeDialogElem = function() {
			var closeElem = dialogElem.getElementsByClassName('close')[0];
			closeElem.addEventListener('click', hideDialogElem);
		};
		
		var imbueComposerMessageElem = function(messageElem) {
			var sendElem = messageElem.getElementsByClassName('send')[0];
			var clearElem = messageElem.getElementsByClassName('clear')[0];
			var editorElem = messageElem.getElementsByClassName('editor')[0];

			sendElem.addEventListener('click', function() {
				var content = getMessageElemContent(messageElem);
				if (content === null || content === '') {
					return;
				}
				
				var newMessageElem = createMessageElem(content);
				var profileId = ['profile', userId].join('.');
				var author = self.contactModels[userId].getAttribute('name');
				var avatar = self.contactModels[userId].getAttribute('avatar');
				var now = new Date();
				var time = formatDate(now);

				sendMessage(content);
				setMessageElemAuthor(newMessageElem, author);
				setMessageElemAvatar(newMessageElem, avatar);
				setMessageElemTime(newMessageElem, time);
				imbueStreamMessageElem(newMessageElem);
				appendMessageElem(newMessageElem);
				html.scrollToBottom(streamWrapElem);
				checkMessageElemOverflow(newMessageElem);
				clearMessageElem(messageElem);
			});

			var enterCode = 13;
			var shiftPressed = false;
			var ctrlPressed = false;

			clearElem.addEventListener('click', function() {
				clearMessageElem(messageElem);
			});
			editorElem.addEventListener('keydown', function(e) {
				if (e.shiftKey) {
					shiftPressed = true;
				}
				if (e.ctrlKey) {
					ctrlPressed = true;
				}
				if (e.keyCode === enterCode && !shiftPressed && !ctrlPressed) {
					sendElem.click();
					editorElem.focus();
					e.preventDefault();
					e.stopPropagation();
				}
			});
			editorElem.addEventListener('keyup', function(e) {
				if (e.shiftKey) {
					shiftPressed = false;
				}
				if (e.ctrlKey) {
					ctrlPressed = false;
				}
			});
			editorElem.addEventListener('blur', function() {
				shiftPressed = false;
				ctrlPressed = false;
			});
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

		var sendMessage = function(content) {
			var type = self.currentContactModel.getAttribute('type');
			var id = self.currentContactModel.getAttribute('id');
			var message = chat.MessageFactory.create(
				uuid.v4(),
				content,
				userId,
				id,
				Date.now()
			);

			switch(type) {
				case 'user':
					chatClient.sendMessage(message);
					break;
				case 'public':
					break;
				case 'theme':
					break;
			}
		};
		
		this.renderMessageElem = function(message) {
			var timestamp = message.value.timestamp;
			var now = new Date(timestamp);
			var time = formatDate(now);
			var from = message.value.from;
			var contactModel = self.contactModels[from];
			var content = base64.decode(message.value.content);
			var author = contactModel.getAttribute('name');
			var avatar = contactModel.getAttribute('avatar');
			var messageElem = createMessageElem(content);
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
						composerAvatarImgElem.src = avatarImg.src;
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
		
		this.prepareContactViews = function() {
			var prepareContactView = function(contactView) {
				contactView.attachTo(contactListElem);
				contactView.on('click', function(event) {
					self.setChatContactModel(event.model);	
				});	
			};
			
			var self = this;
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
			
			var messageKeys = Object.keys(self.messages);
			messageKeys.forEach(function(key) {
				var message = self.messages[key];
				var shown = message.shown;
				var value = message.value || {};
				var from =  value.group || value.from || '';
				if (!shown && from !== userId) {
					var contactModel = self.contactModels[from];
					if (contactModel) {
						var count = contactModel.getAttribute('count');
						count += 1;
						contactModel.setAttribute('count', count);
					}
				};
			});
		};
		
		this.initialize = function() {
			showConversationTitle(false);
			updateConversationTitle('');
			showComposer(false);
			initializeAccountElem();
			initializeComposerMessageElem();
			initializeDialogElem();
			
			var authorizeListener = function(event) {
				console.log('authorize complete');
				
				chatClient.on('message:publiclist', publiclistClientChatListener);
				
				userId = event.userId;
				
				chatClient.publiclist();
			};
			var publiclistClientChatListener = function(event) {
				console.log('publiclist complete');
				
				chatClient.off('message:publiclist', publiclistClientChatListener);
				chatClient.on('message:retrieve', retrievePublicsClientChatListener);
				
				var publiclist = event.response.publiclist;
				var publicIdCollection = publiclist.map(function(public) {
					return public.id;
				});
				var publicIdCollectionString = publicIdCollection.join(',');
				
				console.log('public id collection');
				console.log(publicIdCollectionString);
				
				chatClient.retrieve(publicIdCollectionString);
			};
			var retrievePublicsClientChatListener = function(event) {
				console.log('public details complete');
				
				chatClient.off('message:retrieve', retrievePublicsClientChatListener);
				chatClient.on('message:subscribelist', subscribelistClientChatListener);
				
				var publics = event.response.retrieve;
				var contactModelCollection = publics.map(ContactModelFactory.fromPublic);

				contactModelCollection.forEach(function(contactModel) {
					var contactView = new ContactView(contactModel);
					var id = contactModel.getAttribute('id');
					self.contactModels[id] = contactModel;
					self.contactViews[id] = contactView;
				});
				
				chatClient.subscribelist();
			};
			var subscribelistClientChatListener = function(event) {
				console.log('theme list complete');
				
				chatClient.off('message:subscribelist', subscribelistClientChatListener);
				chatClient.on('message:retrieve', retrieveThemesClientChatListener);
				
				var subscribelist = event.response.subscribelist;
				var themeIdCollection = subscribelist.filter(function(item) {
					return item.type !== 'public';	
				}).map(function(item) {
					return item.id;
				});
				var themeIdCollectionString = themeIdCollection.join(',');
				
				console.log('theme id collection');
				console.log(themeIdCollectionString);
				
				chatClient.retrieve(themeIdCollectionString);
			};
			var retrieveThemesClientChatListener = function(event) {
				console.log('theme details complete');
				
				chatClient.off('message:retrieve', retrieveThemesClientChatListener);
				chatClient.on('message:users', usersClientChatListener);
				
				var themes = event.response.retrieve;
				var contactModelCollection = themes.map(ContactModelFactory.fromTheme);
				
				contactModelCollection.forEach(function(contactModel) {
					var contactView = new ContactView(contactModel);
					var id = contactModel.getAttribute('id');
					self.contactModels[id] = contactModel;
					self.contactViews[id] = contactView;
				});
				
				chatClient.users();
			};
			var usersClientChatListener = function(event) {
				console.log('users complete');
				
				chatClient.off('message:users', usersClientChatListener);
				chatClient.on('message:retrieve', retrieveProfilesClientChatListener);
				
				var users = event.response.users;
				var profileIdCollection = users.map(function(user) {
					return ['profile', user].join('.');
				});
				var profileIdCollectionString = profileIdCollection.join(',');
				
				console.log('profile id collection');
				console.log(profileIdCollectionString);
				
				chatClient.retrieve(profileIdCollectionString);
			};
			var retrieveProfilesClientChatListener = function(event) {
				console.log('profile details complete');
				
				chatClient.off('message:retrieve', retrieveProfilesClientChatListener);
				chatClient.on('message:online', onlineClientChatListener);
				
				var profiles = event.response.retrieve;
				var contactModelCollection = profiles.map(ContactModelFactory.fromProfile);
				
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
				
				chatClient.off('message:online', onlineClientChatListener);
				chatClient.on('message:tape', tapeClientChatListener);
				
				var online = event.response.online;
				online.forEach(function(item) {
					var contactModel = self.contactModels[item];
					if (contactModel) {
						contactModel.setAttribute('online', true);
					}
				});
				
				console.log('online users');
				console.log(JSON.stringify(online, null, 4));
				
				chatClient.tape();
			};
			var tapeClientChatListener = function(event) {
				console.log('tape complete');
				
				chatClient.off('message:tape', tapeClientChatListener);
				chatClient.on('message:retrieve', retrieveMessagesChatListener);
				
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

				chatClient.retrieve(messageIdCollectionString);
			};
			var retrieveMessagesChatListener = function(event) {
				console.log('messages retrieve');
				
				chatClient.off('message:retrieve', retrieveMessagesChatListener);
				
				var messages = event.response.retrieve;
				messages.forEach(function(message) {
					self.messages[message.id].value = message.value;	
				});
				console.log(JSON.stringify(self.messages, null, 4));

				self.prepareContactViews();
				chatClient.on('message:send', sendChatClientListener);
				chatClient.on('message:sent', sentChatClientListener);
				chatClient.on('message:broadcast', broadcastChatClientListener);
			};
			
			var sendChatClientListener = function(event) {
				var message = event.response.send;
				message.value = message.body;
				message.shown = false;
				self.messages[message.id] = message;
				newMessageSoundElem.play();
				
				if (self.currentContactModel !== null && 
					(self.currentContactModel.getAttribute('id') === message.value.from || 
					 self.currentContactModel.getAttribute('id') === message.value.group)) {
					self.renderMessageElem(message);
					html.scrollToBottom(streamWrapElem);
				}
			};
			var sentChatClientListener = function(event) {
				var message = event.response.sent;
				message.value = message.body;
				message.shown = true;
				self.messages[message.id] = message;
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
				
				updateConversationTitle('');
				showConversationTitle(false);
				showComposer(false);
				
				self.dispose();
			};

			self.on('authorize', authorizeListener);
			self.on('disconnect', disconnectListener);
		};
		
		EventEmitter.call(this);
	};
	
	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};