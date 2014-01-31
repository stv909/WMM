var chat = chat || {};

(function(chat, mvp, template) {
	
	var View = mvp.View;
	var ContactModel = chat.models.ContactModel;
	
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

				self.avatarImg.src = 'http://www.dangerouscreation.com/wp-content/uploads/2012/11/blank_avatar.jpg';
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
		this.conversationElem.textContent = title;	
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
	
	var MessageComposerView = function() {
		MessageComposerView.super.constructor.apply(this, arguments);
		
		this.elem = template.create('message-composer-template', { className: 'message' });
		this.elem.classList.add('dynamic');
		
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.editorElem = this.elem.getElementsByClassName('editor')[0];
		this.avatarElem = this.elem.getElementsByClassName('avatar')[0];
	};
	MessageComposerView.super = View.prototype;
	MessageComposerView.prototype = Object.create(View.prototype);
	MessageComposerView.prototype.constructor = MessageComposerView;
	MessageComposerView.prototype.enable = function(isEnable) {
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
	MessageComposerView.prototype.setAvatar = function(avatar) {
		this.avatarElem.src = avatar;	
	};
	
	var MessageStreamView = function(model) {
		MessageComposerView.super.constructor.apply(this, arguments);
		
		this.model = model;
	};
	MessageStreamView.super = View.prototype;
	MessageStreamView.prototype = Object.create(View.prototype);
	MessageStreamView.prototype.constructor = MessageStreamView;
	
	chat.views = {
		ContactView: ContactView,
		AccountView: AccountView,
		ChatboxView: ChatboxView,
		MessageComposerView: MessageComposerView,
		MessageStreamView: MessageStreamView
	};
	
})(chat, mvp, template);