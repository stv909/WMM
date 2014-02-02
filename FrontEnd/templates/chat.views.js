var chat = chat || {};

(function(chat, mvp, template, html) {
	
	var View = mvp.View;

	var ContactModel = chat.models.ContactModel;

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
		mvp.EventTrigger.call(this);
		var self = this;

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
		return this.model;
	};
	ContactView.prototype.attachTo = function(rootElem) {
		if (!this.rootElem) {
			this.rootElem = rootElem;
			this.rootElem.appendChild(this.contactElem);
		}
	};
	ContactView.prototype.detach = function() {
		if (this.rootElem) {
			this.rootElem.removeChild(this.contactElem);
			this.rootElem = null;
		}
	};
	ContactView.prototype.dispose = function() {
		this.trigger('dispose');
		this.detach();
	};
	
	var AccountView = function(chatClient) {
		AccountView.super.constructor.apply(this, arguments);
		var self = this;
		
		this.chatClient = chatClient;
		this.elem = template.create('account-template', { className: 'account' });
		
		this.loginControlsElem = this.elem.getElementsByClassName('login-controls')[0];
		this.logoutControlsElem = this.elem.getElementsByClassName('logout-controls')[0];

		this.loginInputElem = this.elem.getElementsByClassName('login-input')[0];
		this.loginButtonElem = this.elem.getElementsByClassName('login-button')[0];
		this.cancelLoginButtonElem = this.elem.getElementsByClassName('cancel-login-button')[0];
		
		this.nameElem = this.elem.getElementsByClassName('name')[0];
		this.avatarImg = this.elem.getElementsByClassName('avatar')[0].getElementsByTagName('img')[0];
		this.logoutButtonElem = this.elem.getElementsByClassName('logout-button')[0];
		
		this.statusElem = this.elem.getElementsByClassName('status')[0];
			
		this.loginControlsElem.classList.remove('hidden');
		this.logoutControlsElem.classList.add('hidden');
			
		this.statusElem.classList.add('hidden');
		this.cancelLoginButtonElem.classList.add('hidden');
		
		this.userId = null;
		this.loginInputElem.addEventListener('keydown', function(event) {
			if (event.keyCode === 13) {
				self.loginButtonElem.click();
				self.loginInputElem.blur();
			}
		});
		this.loginButtonElem.addEventListener('click', function() {
			self.userId = self.loginInputElem.value;
			self.chatClient.connect();

			self.statusElem.textContent = 'Connecting ...';

			self.statusElem.classList.remove('hidden');
			self.cancelLoginButtonElem.classList.remove('hidden');

			self.loginInputElem.classList.add('hidden');
			self.loginButtonElem.classList.add('hidden');

			var connectChatClientListener = function(event) {
				self.statusElem.textContent = 'Authorizating ...';

				self.chatClient.off('connect', connectChatClientListener);
				self.chatClient.on('message:login', loginChatClientListener);
				self.chatClient.login(self.userId);
			};
			var loginChatClientListener = function(event) {
				self.loginControlsElem.classList.add('hidden');
				self.logoutControlsElem.classList.remove('hidden');

				self.chatClient.off('message:login', loginChatClientListener);
				self.chatClient.on('message:retrieve', retrieveChatClientListener);
				self.chatClient.retrieve(['profile', self.userId].join('.'));
				self.chatClient.broadcast(['online', self.userId].join('.'));
			};
			var retrieveChatClientListener = function(event) {
				self.chatClient.off('message:retrieve', retrieveChatClientListener);

				var profile = event.response.retrieve[0];
				var profileValue = profile.value || {};
				self.avatarImg.src = profileValue.avatar || 'http://simpleicon.com/wp-content/uploads/business-man-1.png';
				self.nameElem.textContent = profileValue.nickname || self.userId;

				self.trigger({
					type: 'authorize',
					account: ContactModel.fromProfile(profile)
				});
			};
			var disconnectChatClientListener = function(event) {
				self.chatClient.off();

				self.loginControlsElem.classList.remove('hidden');
				self.logoutControlsElem.classList.add('hidden');

				self.statusElem.classList.add('hidden');
				self.cancelLoginButtonElem.classList.add('hidden');

				self.loginInputElem.classList.remove('hidden');
				self.loginButtonElem.classList.remove('hidden');

				self.avatarImg.src = '';
				self.nameElem.textContent = "";

				self.trigger({
					type: 'disconnect'
				});
			};

			self.chatClient.on('connect', connectChatClientListener);
			self.chatClient.on('disconnect', disconnectChatClientListener);
		});
		this.logoutButtonElem.addEventListener('click', function(event) {
			self.chatClient.broadcast(['offline', self.userId].join('.'));
			self.chatClient.disconnect();
		});
		this.cancelLoginButtonElem.addEventListener('click', function(event) {
			self.chatClient.disconnect();
		});
	};
	AccountView.super = View.prototype;
	AccountView.prototype = Object.create(View.prototype);
	AccountView.prototype.constructor = AccountView;
	
	var ChatboxView = function(messageComposerView) {
		ChatboxView.super.constructor.apply(this, arguments);
		
		this.messageComposerView = messageComposerView;
		this.elem = template.create('chatbox-template', { className: 'chatbox' });
		
		this.conversationElem = this.elem.getElementsByClassName('conversation')[0];
		this.conversationWrapElem = this.conversationElem.getElementsByClassName('wrap')[0];
		
		this.streamElem = this.elem.getElementsByClassName('stream')[0];
		this.streamWrapElem = this.streamElem.getElementsByClassName('wrap')[0];
		
		this.composerElem = this.elem.getElementsByClassName('composer')[0];
		this.composerWrapElem = this.composerElem.getElementsByClassName('wrap')[0];
		
		this.messageComposerView.attachTo(this.composerWrapElem);
	};
	ChatboxView.super = View.prototype;
	ChatboxView.prototype = Object.create(View.prototype);
	ChatboxView.prototype.constructor = ChatboxView;
	ChatboxView.prototype.setConverstationTitle = function(title) {
		this.conversationWrapElem.textContent = title;	
	};
	ChatboxView.prototype.showConversationTitle = function(isVisible) {
		if (isVisible) {
			this.conversationElem.classList.remove('passive');
		} else {
			this.conversationElem.classList.add('passive');
		}
	};
	ChatboxView.prototype.showMessageComposer = function(isVisible) {
		if (isVisible) {
			this.composerElem.classList.remove('passive');
		} else {
			this.composerElem.classList.add('passive');
		}
	};
	ChatboxView.prototype.enableMessageComposer = function(isEnable) {
		if (isEnable) {
			this.composerElem.classList.add('dynamic');
			this.composerElem.classList.remove('static');
		} else {
			this.composerElem.classList.add('static');
			this.composerElem.classList.remove('dynamic');
		}
		this.messageComposerView.enable(isEnable);	
	};
	ChatboxView.prototype.addMessageView = function(messageView) {
		messageView.attachTo(this.streamWrapElem);
		html.scrollToBottom(this.streamWrapElem);
	};

	
	var MessageView = function() {
		MessageView.super.constructor.apply(this, arguments);
		
		this.containerElem = null;
		this.editorElem = null;
		this.avatarElem = null;
	};
	MessageView.super = View.prototype;
	MessageView.prototype = Object.create(View.prototype);
	MessageView.prototype.constructor = MessageView;
	MessageView.prototype.setAvatar = function(avatar) {
		this.avatarElem.src = avatar;	
	};
	MessageView.prototype.enable = function(isEnable) {
		if (isEnable) {
			this.elem.classList.add('dynamic');
			this.elem.classList.remove('static');
			
			this.containerElem.classList.add('dynamic');
			this.containerElem.classList.remove('static');
			
			this.editorElem.contentEditable = 'true';
		} else {
			this.elem.classList.add('static');
			this.elem.classList.remove('dynamic');
			
			this.containerElem.classList.add('static');
			this.containerElem.classList.remove('dynamic');
			
			this.editorElem.contentEditable = 'false';
		}
	};
	MessageView.prototype.clear = function() {
		this.editorElem.innerHTML = '';
	};
	MessageView.prototype.checkOverflow = function() {
		var isOverflow = html.checkMessageElemOverflow(this.containerElem);
		if (isOverflow) {
			this.containerElem.style.border = '2px solid #fffc63';
		}
		else {
			this.containerElem.style.border = '2px solid #fff';
		}
	};
	MessageView.prototype.setContent = function(content) {
		this.editorElem.innerHTML = content;	
	};
	MessageView.prototype.getContent = function() {
		return this.editorElem.innerHTML;	
	};
	MessageView.prototype.isEditing = function() {
		return this.containerElem.contains('dynamic');
	};
	
	var MessageComposerView = function() {
		MessageComposerView.super.constructor.apply(this, arguments);
		var self = this;
		
		this.elem = template.create('message-composer-template', { className: 'message' });
		this.elem.classList.add('dynamic');
		
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.editorElem = this.elem.getElementsByClassName('editor')[0];
		this.avatarElem = this.elem.getElementsByClassName('avatar')[0];
		this.sendElem = this.elem.getElementsByClassName('send')[0];
		this.clearElem = this.elem.getElementsByClassName('clear')[0];
		
		var enterCode = 13;
		var shiftPressed = false;
		var ctrlPressed = false;
			
		this.sendElem.addEventListener('click', function() {
			var content = self.getContent();
			if (content === null || content === '' || content === '<br>') {
				return;
			}
			
			self.trigger({
				type: 'send',
				content: content
			});
			self.clear();
			
			shiftPressed = false;
			ctrlPressed = false;
		});
		this.clearElem.addEventListener('click', function() {
			self.clear();
		});
		this.editorElem.addEventListener('keydown', function(e) {
			if (e.shiftKey) {
				shiftPressed = true;
			}
			if (e.ctrlKey) {
				ctrlPressed = true;
			}
			if (e.keyCode === enterCode && !shiftPressed && !ctrlPressed) {
				self.sendElem.click();
				self.editorElem.focus();
				e.preventDefault();
				e.stopPropagation();

				shiftPressed = false;
				ctrlPressed = false;
			}
		});
		this.editorElem.addEventListener('keyup', function(e) {
			if (e.shiftKey) {
				shiftPressed = false;
			}
			if (e.ctrlKey) {
				ctrlPressed = false;
			}
		});
		this.editorElem.addEventListener('blur', function() {
			shiftPressed = false;
			ctrlPressed = false;
		});
	};
	MessageComposerView.super = MessageView.prototype;
	MessageComposerView.prototype = Object.create(MessageView.prototype);
	MessageComposerView.prototype.constructor = MessageComposerView;

	var MessageStreamView = function(model) {
		MessageComposerView.super.constructor.apply(this, arguments);
		var self = this;
		
		this.model = model;
		this.elem = template.create('message-stream-template', { className: 'message' });
		
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.editorElem = this.elem.getElementsByClassName('editor')[0];
		this.avatarElem = this.elem.getElementsByClassName('avatar')[0];
		this.nameElem = this.elem.getElementsByClassName('name')[0];
		this.timeElem = this.elem.getElementsByClassName('time')[0];
		
		this.editElem = this.elem.getElementsByClassName('edit')[0];
		this.clearElem = this.elem.getElementsByClassName('clear')[0];
		this.cancelElem = this.elem.getElementsByClassName('cancel')[0];
		this.shareElem = this.elem.getElementsByClassName('share')[0];
		this.fullscreenElem = this.elem.getElementsByClassName('fullscreen')[0];
		this.deleteElem = this.elem.getElementsByClassName('delete')[0];

		this.elem.classList.add('static');
		this.containerElem.classList.add('static');

		var editElemClickListener = function(event) {
			alert('edit');
		};
		var clearElemClickListener = function(event) {
			alert('clear');
		};
		var cancelElemClickListener = function(event) {
			alert('cancel');
		};
		var shareElemClickListener = function(event) {
			alert('share');
		};
		var fullscreenElemClickListener = function(event) {
			alert('fullscreen');
		};
		var deleteElemClickListener = function(event) {
			alert('delete');
		};
		
		this.editElem.addEventListener('click', editElemClickListener);
		this.clearElem.addEventListener('click', clearElemClickListener);
		this.cancelElem.addEventListener('click', cancelElemClickListener);
		this.shareElem.addEventListener('click', shareElemClickListener);
		this.fullscreenElem.addEventListener('click', fullscreenElemClickListener);
		this.deleteElem.addEventListener('click', deleteElemClickListener);

		var changeTimestampListener = function(event) {
			var timestamp = event.timestamp;
			var date = timestamp ? new Date(timestamp) : new Date();

			self.timeElem.textContent = formatDate(date);
		};
		var changeContentListener = function(event) {
			self.editorElem.innerHTML = event.content;
		};

		this.model.on('change:timestamp', changeTimestampListener);
		this.model.on('change:content', changeContentListener);

		changeTimestampListener({
			timestamp: this.model.getAttribute('timestamp')
		});
		changeContentListener({
			content: this.model.getAttribute('content')
		});

		var contact = this.model.getAttribute('contact');

		var changeAvatarListener = function(event) {
			self.avatarElem.src = event.avatar;
		};
		var changeNameListener = function(event) {
			self.nameElem.textContent = event.name || contact.getAttribute('id');
		};

		contact.on('change:avatar', changeAvatarListener);
		contact.on('change:name', changeNameListener);

		changeAvatarListener({
			avatar: contact.getAttribute('avatar')
		});
		changeNameListener({
			name: contact.getAttribute('name')
		});
		
		var disposeListener = function() {
			self.editorElem.removeEventListener('click', editElemClickListener);
			self.clearElem.removeEventListener('click', clearElemClickListener);
			self.cancelElem.removeEventListener('click', cancelElemClickListener);
			self.shareElem.removeEventListener('click', shareElemClickListener);
			self.fullscreenElem.removeEventListener('click', fullscreenElemClickListener);
			self.deleteElem.removeEventListener('click', deleteElemClickListener);

			self.off('change:timestamp', changeTimestampListener);
			self.off('change:content', changeContentListener);

			contact.off('change:avatar', changeAvatarListener);
			contact.off('change:name', changeNameListener);
		};
		
		this.on('dispose', disposeListener);
	};
	MessageStreamView.super = MessageView.prototype;
	MessageStreamView.prototype = Object.create(MessageView.prototype);
	MessageStreamView.prototype.constructor = MessageStreamView;
	MessageStreamView.prototype.beginEditing = function() {
		this.editElem.textContent = 'finish';
		this.clearElem.style.display = 'block';
		this.cancelElem.style.display = 'block';
		this.shareElem.style.display = 'none';
		this.fullscreenElem.style.display = 'none';
		this.deleteElem.style.display = 'none';

		this.elem.className = 'message dynamic';
		this.containerElem.className = 'container dynamic';
		this.containerElem.style.overflow = 'scroll';
		this.containerElem.style.border = '2px solid #ddd';
		this.editorElem.contentEditable = 'true';
		
		this._tempContent = this.model.getAttribute('content');
		
		this.trigger({
			type: 'editing:begin',
			model: this.model,
			elem: this.elem
		});
	};
	MessageStreamView.prototype.endEditing = function() {
		this.editElem.textContent = 'edit';
		this.clearElem.style.display = 'none';
		this.cancelElem.style.display = 'none';
		this.shareElem.style.display = 'block';
		this.fullscreenElem.style.display = 'block';
		this.deleteElem.style.display = 'block';

		this.elem.className = 'message static';
		this.containerElem.className = 'container static';
		this.containerElem.style.overflow = 'hidden';
		this.containerElem.scrollTop = 0;
		this.containerElem.scrollLeft = 0;
		this.editorElem.contentEditable = 'false';
		
		this._tempContent = null;
		
		this.trigger({
			type: 'editing:end',
			model: this.model,
			elem: this.elem
		});
	};
	MessageStreamView.prototype.cancelEditing = function() {
		this.editElem.textContent = 'edit';
		this.clearElem.style.display = 'none';
		this.cancelElem.style.display = 'none';
		this.shareElem.style.display = 'block';
		this.fullscreenElem.style.display = 'block';
		this.deleteElem.style.display = 'block';

		this.elem.className = 'message static';
		this.containerElem.className = 'container static';
		this.containerElem.style.overflow = 'hidden';
		this.containerElem.scrollTop = 0;
		this.containerElem.scrollLeft = 0;
		this.editorElem.contentEditable = 'false';
		
		this.model.setAttribute('content', this._tempContent);
		this._tempContent = null;
		
		this.trigger({
			type: 'editing:cancel',
			model: this.model,
			elem: this.elem
		});
	};
	
	var DialogView = function() {
		DialogView.super.constructor.apply(this, arguments);
		var self = this;
		
		this.elem = document.getElementById('dialog');
		this.contentElem = this.elem.getElementsByClassName('content')[0];
		this.pageElem = document.getElementById('page');
		this.closeElem = this.elem.getElementsByClassName('close')[0];
		
		this.closeElem.addEventListener('click', function() {
			self.close();
		});
	};
	DialogView.super = View.prototype;
	DialogView.prototype = Object.create(View.prototype);
	DialogView.prototype.constructor = DialogView;
	DialogView.prototype.show = function(content) {
		this.pageElem.className = 'passive';
		this.elem.className = 'active';
		this.contentElem.innerHTML = content;
	};
	DialogView.prototype.close = function() {
		this.pageElem.className = 'active';
		this.elem.className = 'passive';
		this.contentElem.innerHTML = 'content';
		this.contentElem.scrollLeft = 0;
		this.contentElem.scrollTop = 0;
	};
	
	chat.views = {
		ContactView: ContactView,
		AccountView: AccountView,
		ChatboxView: ChatboxView,
		MessageComposerView: MessageComposerView,
		MessageStreamView: MessageStreamView,
		DialogView: DialogView,
	};
	
})(chat, mvp, template, html);