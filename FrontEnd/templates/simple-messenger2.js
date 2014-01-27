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
		return [hours <= 9 ? 'o' + hours : hours, minutes <= 9 ? '0' + minutes : minutes].join(':');
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
	
	var MessageControl = function(model) {
		this.model = model;
		
		this.messageElem = createTemplateElem('message');
		this.userElem = this.messageElem.getElementsByClassName('user')[0];
		this.timeElem = this.messageElem.getElementsByClassName('time')[0];
		
		this.userElem.textContent = this.model.getAuthor();
		this.timeElem.textContent = this.model.getTimestamp();
	};
	
	var ChatApplication = function() {
		var self = this;
		
		var serverUrl = 'ws://www.bazelevscontent.net:9009/';
		var chatClient = new ChatClient(serverUrl);

		var pageElem = document.getElementById('page');
		var dialogElem = document.getElementById('dialog');
		var menuElem = document.getElementById('menu');
		var contactsElem = document.getElementById('contacts');
		var composerElem = document.getElementById('composer');
		var composerAvatarImgElem = composerElem
			.getElementsByClassName('avatar')[0]
			.getElementsByClassName('image')[0]
			.getElementsByTagName('img')[0];
		var streamElem = document.getElementById('stream');
		var streamWrapElem = streamElem.getElementsByClassName('wrap')[0];
		var newMessageSoundElem = document.getElementById('new-message-sound');
		
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
		var createContactList = function(profileCollection) {
			profileCollection.forEach(function(profile) {
				if (profile.id !== ['profile', userId].join('.')) {
					createContact(profile);
				} else {
					profiles[profile.id] = profile;
				}
			});
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
		var getContactName = function(profileId) {
			var profile = profiles[profileId];
			var profileValue = profile.value || {};
			var nickname = profileValue.nickname || profileId.replace('profile.', '');	
			return nickname;
		};
		var getContactAvatarUrl = function(profileId) {
			var profile = profiles[profileId];
			var profileValue = profile.value || {};
			var avatar = profileValue.avatar || 'http://simpleicon.com/wp-content/uploads/business-man-1.png';
			return avatar;
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
				nameTextElem.textContent = '{' + themeValue.label + '}';
				avatarImageElem.src = 'http://simpleicon.com/wp-content/uploads/group-1.png';
				
				newThemeElem.addEventListener('click', function() {
					self.trigger({
						type: 'select:theme',
						themeId: themeValue.id
					});
				});
				
				themeMap[theme.id] = newThemeElem;
				themes[theme.id] = theme;
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
		
		var _messages = [];
		var _chatMode = null;
		var _companionId = null;
		var changeChat = function(mode, companionId) {
			if (_chatMode !== mode || _companionId !== companionId) {
				_chatMode = mode;
				_companionId = companionId;
				
				chatClient.off('message:groupuserlist');
				deleteAllMessageElems();
				showComposer(true);
				
				console.log(userId);
				console.log(_companionId);
				
				switch (_chatMode) {
					case 'public':
						setPublicChat(_companionId);
						break;
					case 'theme':
						setThemeChat(_companionId);
						break;
					case 'contact':
						setContactChat(_companionId);
						break;
					default:
						break;
				}
				
				html.scrollToBottom(streamWrapElem);
			}
		};
		var resetChat = function() {
			_chatMode = null;	
			_companionId = null;
		};
		var setContactChat = function(contactId) {
			var profileId = ['profile', contactId].join('.');
			var profile = profiles[profileId];
			var value = profile.value || {};
			var nickname = value.nickname || contactId;
			//var title = [nickname, 'and', 'Me'].join(' ');

			updateConversationTitle(nickname);
			showConversationTitle(true);
			
			var chatMessages = _messages.filter(function(message) {
				return (message.value.from === userId && message.value.to === _companionId) ||
					(message.value.from === _companionId && message.value.to === userId);
			});
			
			chatMessages.forEach(function(message) {
				var timestamp = message.value.timestamp;
				var now = new Date(timestamp);
				var time = formatDate(now);
				var profileId = ['profile', message.value.from].join('.');
				var content = base64.decode(message.value.content);
				var author = getContactName(profileId);
				var avatar = getContactAvatarUrl(profileId);
				var messageElem = createMessageElem(content);
				imbueStreamMessageElem(messageElem);
				setMessageElemAuthor(messageElem, author);
				setMessageElemAvatar(messageElem, avatar);
				setMessageElemTime(messageElem, time);
				appendMessageElem(messageElem);
			});
		};
		var setPublicChat = function(publicId) {
			var getUserNickname = function(id) {
				var profileId = ['profile', id].join('.');
				var profile = profiles[profileId];
				var value = profile.value || {};
				var nickname = value.nickname || id;
				return nickname;
			};
			
			var fullPublicId = ['public', publicId].join('.');
			var public = publicDetails[fullPublicId];
			var value = public.value;
			var author = [value.auther];
			var label = ['[', value.label, ']: '];
			var moderators = Object.keys(value.moderators);

			var allUsers = moderators.concat(author).filter(function(user) {
				return user !== userId;
			}).map(function(user) {
				return getUserNickname(user);
			});
			
			var title = label.concat([allUsers.join(', ')]).join('');
			
			updateConversationTitle(title);
			showConversationTitle(true);
		};
		var setThemeChat = function(themeId) {
			var getUserNickname = function(id) {
				var profileId = ['profile', id].join('.');
				var profile = profiles[profileId];
				var value = profile.value || {};
				var nickname = value.nickname || id;
				return nickname;
			};

			var fullThemeId = ['theme', themeId].join('.');
			var theme = themes[fullThemeId];
			var value = theme.value;
			var author = [value.auther];
			var label = ['{', value.label, '}: '];
			
			var createGroupuserlistListener = function() {
				var groupuserlistListener = function(event) {
					var groupuserlist = event.response.groupuserlist;
					var currentgroup = groupuserlist[0];
					var users = currentgroup.users || [];
					var title = label.concat(users.join(', ')).join('');
					updateConversationTitle(title);
					chatClient.off("groupuserlist", groupuserlistListener);
				};
				return groupuserlistListener;
			};
			chatClient.off('message:groupuserlist');
			chatClient.on('message:groupuserlist', createGroupuserlistListener());
			chatClient.groupuserlist(fullThemeId);
			
			var title = label.concat([author, ' and ...'].join(', ')).join('');
			updateConversationTitle(title);
			showConversationTitle(true);
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
				var author = getContactName(profileId);
				var avatar = getContactAvatarUrl(profileId);
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
			var message = chat.MessageFactory.create(
				uuid.v4(),
				content,
				userId,
				_companionId,
				Date.now()
			);
			switch(_chatMode) {
				case 'contact':
					chatClient.sendMessage(message);
					break;
				case 'public':
					break;
				case 'theme':
					break;
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
		
		self.initialize = function() {
			var groupLoadCounter = new Counter(2);
			groupLoadCounter.on('empty', function() {
				chatClient.users();
			});
						
			showConversationTitle(false);
			updateConversationTitle('');
			showComposer(false);
			initializeAccountElem();
			initializeComposerMessageElem();
			initializeDialogElem();
			
			var authorizeListener = function(event) {
				userId = event.userId;
				loadOperationCounter.reset(4);
				groupLoadCounter.reset(2);
				loadOperationCounter.on('empty', emptyLoadOperationCounterListener);
				
				chatClient.on('message:publiclist', publiclistClientChatListener);
				chatClient.on('message:subscribelist', subscribelistClienChatListener);
				chatClient.on('message:users', usersClientChatListener);
				chatClient.on('message:tape', tapeClientChatListener);
				
				chatClient.publiclist();
				chatClient.subscribelist();
			};
			var disconnectListener = function(event) {
				chatClient.off('message:users');
				chatClient.off('message:retrieve');
				chatClient.off('message:publiclist');
				chatClient.off('message:send');
				chatClient.off('message:sent');
				chatClient.off('message:online');
				chatClient.off('message:subscribelist');
				chatClient.off('message:groupuserlist');
				chatClient.off('message:tape');
				loadOperationCounter.off('empty', emptyLoadOperationCounterListener);
				
				deleteAllPublics();
				deleteAllContacts();
				deleteAllThemes();
				deleteAllMessageElems();
				deleteAllMessages();
				
				updateConversationTitle('');
				showConversationTitle(false);
				showComposer(false);
				resetChat();
			};
			
			//loading tape
			var tapeClientChatListener = function(event) {
				chatClient.off('message:tape', tapeClientChatListener);
				chatClient.on('message:retrieve', retrieveMessagesChatClientListener);
				
				var tape = event.response.tape;
				var messageIds = tape.map(function(message) {
					return message.id;	
				});
				chatClient.retrieve(messageIds.join(','));
			};
			var retrieveMessagesChatClientListener = function(event) {
				chatClient.off('message:retrieve', retrieveMessagesChatClientListener);
				
				var retrieve = event.response.retrieve;
				loadOperationCounter.release();
				_messages = retrieve;
				console.log(_messages);
			};
			
			//loading user profiles
			var usersClientChatListener = function(event) {
				chatClient.off('message:users', usersClientChatListener);
				chatClient.on('message:retrieve', retrieveProfilesClientChatListener);
				
				var users = event.response.users;
				var profileIds = users.map(function(user) {
					return ['profile', user].join('.');
				});
				chatClient.retrieve(profileIds.join());
			};
			var retrieveProfilesClientChatListener = function(event) {
				chatClient.off('message:retrieve', retrieveProfilesClientChatListener);
				chatClient.on('message:online', onlineClientChatListener);
				
				chatClient.online();
				var profiles = event.response.retrieve;
				createContactList(profiles);
				loadOperationCounter.release();
				chatClient.tape();
			};
			var onlineClientChatListener = function(event) {
				var online = event.response.online;
				chatClient.off('message:online', onlineClientChatListener);
				updateOnlineContacts(online);
			};
			
			//loading publiclist
			var publiclistClientChatListener = function(event) {
				chatClient.off('message:publiclist', publiclistClientChatListener);
				chatClient.on('message:retrieve', retrievePublicsClientChatListener);
				
				var publiclist = event.response.publiclist;
				var publicIds = publiclist.map(function(public) {
					return public.id;
				});
				chatClient.retrieve(publicIds.join(','));
			};
			var retrievePublicsClientChatListener = function(event) {
				chatClient.off('message:retrieve', retrievePublicsClientChatListener);
				
				var publicDetails = event.response.retrieve;
				createPublicList(publicDetails);
				loadOperationCounter.release();	
				groupLoadCounter.release();
			};
			
			//loading themes
			var subscribelistClienChatListener = function(event) {
				chatClient.off('message:subscribelist', subscribelistClienChatListener);
				chatClient.on('message:retrieve', retrieveThemesClientChatListener);
				
				var subscribelist = event.response.subscribelist;
				var themeIds = subscribelist.filter(function(item) {
					return item.type !== 'public';	
				}).map(function(item) {
					return item.id;
				});

				chatClient.retrieve(themeIds.join(','));
			};
			var retrieveThemesClientChatListener = function(event) {
				chatClient.off('message:retrieve', retrieveThemesClientChatListener);
	
				var themes = event.response.retrieve;
				createThemeList(themes);
				loadOperationCounter.release();
				groupLoadCounter.release();
			};
			
			//all startup info loaded
			var emptyLoadOperationCounterListener = function() {
				loadOperationCounter.off('empty', loadOperationCounter);
				chatClient.on('message:send', sendChatClientListener);
				chatClient.on('message:sent', sentChatClientListener);
			};
			var sendChatClientListener = function(event) {
				var send = event.response.send;
				send.value = send.body;
				_messages.push(send);
				newMessageSoundElem.play();
				if (_companionId === send.from && _chatMode === 'contact') {
					console.log(send);
					var timestamp = send.body.timestamp;
					var now = new Date(timestamp);
					var time = formatDate(now);
					var profileId = ['profile', send.from].join('.');
					var content = base64.decode(send.body.content);
					var author = getContactName(profileId);
					var avatar = getContactAvatarUrl(profileId);
					var messageElem = createMessageElem(content);
					imbueStreamMessageElem(messageElem);
					setMessageElemAuthor(messageElem, author);
					setMessageElemAvatar(messageElem, avatar);
					setMessageElemTime(messageElem, time);
					appendMessageElem(messageElem);
				}
			};
			var sentChatClientListener = function(event) {
				var sent = event.response.sent;
				sent.value = sent.body;
				_messages.push(sent);
			};
			
			self.on('authorize', authorizeListener);
			self.on('disconnect', disconnectListener);
			
			self.on('select:contact', function(event) {
				changeChat('contact', event.contactId);
			});
			self.on('select:public', function(event) {
				showConversationTitle(true);
				changeChat('public', event.publicId);
			});
			self.on('select:theme', function(event) {
				showConversationTitle(true);
				changeChat('theme', event.themeId);
			});
		};
		
		EventEmitter.call(self);
	};
	
	var chatApplication = new ChatApplication();
	chatApplication.initialize();
};