var chat = chat || {};

(function(chat, mvp, template, html) {

	var View = mvp.View;

	var ContactModel = chat.models.ContactModel;
	
	var defer = function() {
		var result = {};
		result.promise = new Promise(function(resolve, reject) {
			result.resolve = resolve;
			result.reject = reject;
		});
		return result;
	};
	
	var requestAsync = function(options) {
		var url = options.url;
		var method = options.method;
		var data = options.data;
		var request = new XMLHttpRequest();
		var deferred = defer();
		var promise = deferred.promise;
		
		promise.cancel = function() {
			request.abort();
		};
		
		request.open(method, url, true);
		request.onload = function() {
			deferred.resolve(request.responseText);
		};
		request.abort = function() {
			deferred.reject(new Error('request aborted'));
		};
		request.onerror = function(error) {
			deferred.reject(new Error(error));
		};
		request.send(data);
		
		return promise;
	};
	
	VK.Auth.getLoginStatusAsync = function() {
		var deferred = defer();
		VK.Auth.getLoginStatus(function(response) {
			if (response.session) {
				deferred.resolve(response.session);
			} else {
				deferred.reject(new Error('user is not authorized'));
			}
		});
		return deferred.promise;
	};
	VK.Auth.loginAsync = function(settings) {
		var deferred = defer();
		VK.Auth.login(function(response) {
			if (response.session) {
				deferred.resolve(response.session);
			} else {
				deferred.reject(new Error('user is not authorized'));
			}
		}, settings);
		return deferred.promise;
	};
	VK.Api.callAsync = function(method, params) {
		var deferred = defer();	
		VK.Api.call(method, params, deferred.resolve);
		return deferred.promise;
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
		mvp.EventTrigger.apply(this);
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
		AccountView.super.apply(this, arguments);
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
	AccountView.super = View;
	AccountView.prototype = Object.create(View.prototype);
	AccountView.prototype.constructor = AccountView;
	
	var ChatboxView = function(messageComposerView) {
		ChatboxView.super.apply(this, arguments);
		
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
	ChatboxView.super = View;
	ChatboxView.prototype = Object.create(View.prototype);
	ChatboxView.prototype.constructor = ChatboxView;
	ChatboxView.prototype.setConverstationTitle = function(title) {
		this.conversationWrapElem.textContent = title;	
	};
	ChatboxView.prototype.showConversationTitle = function(isVisible) {
		if (isVisible) {
			this.conversationElem.classList.remove('hidden');
		} else {
			this.conversationElem.classList.add('hidden');
		}
	};
	ChatboxView.prototype.showMessageComposer = function(isVisible) {
		if (isVisible) {
			this.composerElem.classList.remove('hidden');
		} else {
			this.composerElem.classList.add('hidden');
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
		MessageView.super.apply(this, arguments);
		
		this.containerElem = null;
		this.editorElem = null;
		this.avatarElem = null;
	};
	MessageView.super = View;
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
		var isOverflow = html.checkElemOverflow(this.containerElem);
		if (isOverflow) {
			this.containerElem.classList.add('overflow');
		}
		else {
			this.containerElem.classList.remove('overflow');
		}
		return isOverflow;
	};
	MessageView.prototype.setContent = function(content) {
		this.editorElem.innerHTML = content;	
	};
	MessageView.prototype.getContent = function() {
		return this.editorElem.innerHTML;	
	};
	MessageView.prototype.isEditing = function() {
		return this.containerElem.classList.contains('dynamic');
	};
	
	var MessageComposerView = function() {
		MessageComposerView.super.apply(this, arguments);
		var self = this;
		
		this.elem = template.create('message-composer-template', { className: 'message' });
		this.elem.classList.add('dynamic');
		
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.editorElem = this.elem.getElementsByClassName('editor')[0];
		this.avatarElem = this.elem.getElementsByClassName('avatar')[0];
		this.sendElem = this.elem.getElementsByClassName('send')[0];
		this.clearElem = this.elem.getElementsByClassName('clear')[0];
			
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
		});
		this.clearElem.addEventListener('click', function() {
			self.clear();
		});
		this.editorElem.addEventListener('keydown', function(e) {
			if (e.keyCode === 13 && !e.shiftKey && !e.ctrlKey) {
				self.sendElem.click();
				self.editorElem.focus();
				e.preventDefault();
				e.stopPropagation();
			}
		});
	};
	MessageComposerView.super = MessageView;
	MessageComposerView.prototype = Object.create(MessageView.prototype);
	MessageComposerView.prototype.constructor = MessageComposerView;

	var MessageStreamView = function(model) {
		MessageStreamView.super.apply(this, arguments);
		var self = this;
		
		this.model = model;
		this.elem = template.create('message-stream-template', { className: 'message' });
		
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.editorElem = this.elem.getElementsByClassName('editor')[0];
		this.avatarElem = this.elem.getElementsByClassName('avatar')[0];
		this.nameElem = this.elem.getElementsByClassName('name')[0];
		this.timeElem = this.elem.getElementsByClassName('time')[0];

		this.overflowFullscreenElem = this.elem.getElementsByClassName('overflow-fullscreen')[0];
		this.moreElem = this.elem.getElementsByClassName('more')[0];
		this.buttonsHolderElem = this.elem.getElementsByClassName('buttons-holder')[0];
		this.editElem = this.elem.getElementsByClassName('edit')[0];
		this.clearElem = this.elem.getElementsByClassName('clear')[0];
		this.cancelElem = this.elem.getElementsByClassName('cancel')[0];
		this.borrowElem = this.elem.getElementsByClassName('borrow')[0];
		this.shareElem = this.elem.getElementsByClassName('share')[0];
		this.wallElem = this.elem.getElementsByClassName('wall')[0];
		this.fullscreenElem = this.elem.getElementsByClassName('fullscreen')[0];
		this.hideElem = this.elem.getElementsByClassName('hide')[0];
		this.deleteElem = this.elem.getElementsByClassName('delete')[0];

		this.elem.classList.add('static');
		this.containerElem.classList.add('static');

		var elemMousemoveListener = function(event) {
			self.elem.removeEventListener('mousemove', elemMousemoveListener);

			var shown = self.model.getAttribute('shown');
			var type = self.model.getAttribute('type');
			var isUser = type === 'user';
			var contact = isUser ? self.model.getAttribute('contact') : self.model.getAttribute('receiver');
			var count = contact.getAttribute('count') - 1;

			contact.setAttribute('count', count);
			self.model.setAttribute('shown', true);
			self.elem.classList.remove('unshown');
		};
		var moreElemClickListener = function(event) {
			if (self.moreElem.textContent === 'more...') {
				self.moreElem.textContent = 'less';
				self.buttonsHolderElem.classList.remove('hidden');
			} else {
				self.moreElem.textContent = 'more...';
				self.buttonsHolderElem.classList.add('hidden');
			}
		};
		var editElemClickListener = function(event) {
			if (self.isEditing()) {
				self.endEditing();
			} else {
				self.beginEditing();
				self.editorElem.focus();
			}
		};
		var editorElemKeydownListener = function(event) {
			if (self.isEditing()) {
				if (event.keyCode === 13 && !event.shiftKey && !event.ctrlKey) {
					self.endEditing();
				}
				if (event.keyCode === 27) {
					self.cancelEditing();
				}
			}
		};
		var clearElemClickListener = function(event) {
			self.clear();
		};
		var cancelElemClickListener = function(event) {
			self.cancelEditing();
		};
		var borrowElemClickListener = function(event) {
			self.trigger({
				type: 'click:borrow',
				model: self.model
			});
		};
		var shareElemClickListener = function(event) {
			self.trigger({
				type: 'click:share',
				model: self.model
			});
		};
		var wallElemClickListener = function(event) {
			self.trigger({
				type: 'click:wall',
				model: self.model
			});
		};
		var fullscreenElemClickListener = function(event) {
			self.trigger({
				type: 'click:fullscreen',
				model: self.model
			});
		};
		var hideElemClickListener = function(event) {
			self.trigger({
				type: 'click:hide',
				model: self.model
			});
		};
		var deleteElemClickListener = function(event) {
			self.trigger({
				type: 'click:delete',
				model: self.model
			});
		};
		var containerElemOverflowListener = function(event) {
			if (!self.isEditing()) {
				self.checkOverflow();
			}
		};

		var shown = this.model.getAttribute('shown');
		if (!shown) {
			this.elem.addEventListener('mousemove', elemMousemoveListener);
			this.elem.classList.add('unshown');
		}
		var own = this.model.getAttribute('own');
		if (own) {
			this.hideElem.classList.add('super-hidden');
		} else {
			this.editElem.classList.add('super-hidden');
			this.cancelElem.classList.add('super-hidden');
			this.clearElem.classList.add('super-hidden');
			this.deleteElem.classList.add('super-hidden');
		}
		this.editElem.addEventListener('click', editElemClickListener);
		this.moreElem.addEventListener('click', moreElemClickListener);
		this.editorElem.addEventListener('keydown', editorElemKeydownListener);
		this.clearElem.addEventListener('click', clearElemClickListener);
		this.cancelElem.addEventListener('click', cancelElemClickListener);
		this.borrowElem.addEventListener('click', borrowElemClickListener);
		this.shareElem.addEventListener('click', shareElemClickListener);
		this.wallElem.addEventListener('click', wallElemClickListener);
		this.fullscreenElem.addEventListener('click', fullscreenElemClickListener);
		this.overflowFullscreenElem.addEventListener('click', fullscreenElemClickListener);
		this.deleteElem.addEventListener('click', deleteElemClickListener);
		this.hideElem.addEventListener('click', hideElemClickListener);
		this.containerElem.addEventListener('overflowchanged', containerElemOverflowListener);

		var changeTimestampListener = function(event) {
			var timestamp = event.value;
			var date = timestamp ? new Date(timestamp) : null;

			self.timeElem.textContent = (date) ? formatDate(date): '';
		};
		var changeContentListener = function(event) {
			self.editorElem.innerHTML = event.value;
		};

		this.model.on('change:timestamp', changeTimestampListener);
		this.model.on('change:content', changeContentListener);

		changeTimestampListener({
			value: this.model.getAttribute('timestamp')
		});
		changeContentListener({
			value: this.model.getAttribute('content')
		});

		var contact = this.model.getAttribute('contact');

		var changeAvatarListener = function(event) {
			self.avatarElem.src = event.avatar;
		};
		var changeNameListener = function(event) {
			self.nameElem.textContent = event.name || contact.getAttribute('id');
		};

		changeAvatarListener({
			avatar: contact.getAttribute('avatar')
		});
		changeNameListener({
			name: contact.getAttribute('name')
		});
		
		var disposeListener = function() {
			self.elem.removeEventListener('mousemove', elemMousemoveListener);
			self.moreElem.removeEventListener('click', moreElemClickListener);
			self.editElem.removeEventListener('click', editElemClickListener);
			self.editorElem.removeEventListener('keydown', editorElemKeydownListener);
			self.clearElem.removeEventListener('click', clearElemClickListener);
			self.cancelElem.removeEventListener('click', cancelElemClickListener);
			self.borrowElem.removeEventListener('click', borrowElemClickListener);
			self.shareElem.removeEventListener('click', shareElemClickListener);
			self.wallElem.removeEventListener('click', wallElemClickListener);
			self.fullscreenElem.removeEventListener('click', fullscreenElemClickListener);
			self.overflowFullscreenElem.removeEventListener('click', fullscreenElemClickListener);
			self.hideElem.removeEventListener('click', removeEventListener);
			self.deleteElem.removeEventListener('click', deleteElemClickListener);
			self.containerElem.removeEventListener('overflowchanged', containerElemOverflowListener);

			self.off('change:timestamp', changeTimestampListener);
			self.off('change:content', changeContentListener);

			contact.off('change:avatar', changeAvatarListener);
			contact.off('change:name', changeNameListener);
		};
		
		this.on('dispose', disposeListener);
	};
	MessageStreamView.super = MessageView;
	MessageStreamView.prototype = Object.create(MessageView.prototype);
	MessageStreamView.prototype.constructor = MessageStreamView;
	MessageStreamView.prototype.beginEditing = function() {
		this.editElem.textContent = 'finish';
		this.moreElem.classList.add('hidden');
		this.clearElem.classList.remove('hidden');
		this.cancelElem.classList.remove('hidden');
		this.borrowElem.classList.add('hidden');
		this.shareElem.classList.add('hidden');
		this.wallElem.classList.add('hidden');
		this.fullscreenElem.classList.add('hidden');
		this.overflowFullscreenElem.classList.add('hidden');
		this.hideElem.classList.add('hidden');
		this.deleteElem.classList.add('hidden');

		this.elem.classList.add('dynamic');
		this.elem.classList.remove('static');
		this.containerElem.classList.add('dynamic');
		this.containerElem.classList.remove('static');
		this.containerElem.classList.remove('overflow');
		this.containerElem.style.overflow = 'scroll';
		this.editorElem.contentEditable = 'true';

		this._tempContent = this.editorElem.innerHTML;

		this.trigger({
			type: 'editing:begin',
			model: this.model,
			elem: this.elem
		});
	};
	MessageStreamView.prototype.endEditing = function() {
		this.editElem.textContent = 'edit';
		this.moreElem.classList.remove('hidden');
		this.clearElem.classList.add('hidden');
		this.cancelElem.classList.add('hidden');
		this.borrowElem.classList.remove('hidden');
		this.shareElem.classList.remove('hidden');
		this.wallElem.classList.remove('hidden');
		this.fullscreenElem.classList.remove('hidden');
		this.overflowFullscreenElem.classList.remove('hidden');
		this.hideElem.classList.remove('hidden');
		this.deleteElem.classList.remove('hidden');

		this.elem.classList.add('static');
		this.elem.classList.remove('dynamic');
		this.containerElem.classList.add('static');
		this.containerElem.classList.remove('dynamic');
		this.containerElem.style.overflow = 'hidden';
		this.containerElem.scrollTop = 0;
		this.containerElem.scrollLeft = 0;
		this.editorElem.contentEditable = 'false';

		if (this._tempContent !== this.editorElem.innerHTML) {
			this.model.setAttribute('content', this.editorElem.innerHTML);
		}
		this._tempContent = null;

		this.checkOverflow();
		this.trigger({
			type: 'editing:end',
			model: this.model,
			elem: this.elem
		});
	};
	MessageStreamView.prototype.cancelEditing = function() {
		this.editElem.textContent = 'edit';
		this.moreElem.classList.remove('hidden');
		this.clearElem.classList.add('hidden');
		this.cancelElem.classList.add('hidden');
		this.borrowElem.classList.remove('hidden');
		this.shareElem.classList.remove('hidden');
		this.wallElem.classList.remove('hidden');
		this.fullscreenElem.classList.remove('hidden');
		this.overflowFullscreenElem.classList.remove('hidden');
		this.hideElem.classList.remove('hidden');
		this.deleteElem.classList.remove('hidden');

		this.elem.classList.add('static');
		this.elem.classList.remove('dynamic');
		this.containerElem.classList.add('static');
		this.containerElem.classList.remove('dynamic');
		this.containerElem.style.overflow = 'hidden';
		this.containerElem.scrollTop = 0;
		this.containerElem.scrollLeft = 0;
		this.editorElem.contentEditable = 'false';

		this.editorElem.innerHTML = this._tempContent;

		this.checkOverflow();
		this.trigger({
			type: 'editing:cancel',
			model: this.model,
			elem: this.elem
		});
	};
	MessageStreamView.prototype.checkOverflow = function() {
		var isOverflow = MessageStreamView.super.prototype.checkOverflow.apply(this);
		if (isOverflow) {
			this.overflowFullscreenElem.classList.remove('super-hidden');
			this.fullscreenElem.classList.add('super-hidden');
		} else {
			this.overflowFullscreenElem.classList.add('super-hidden');
			this.fullscreenElem.classList.remove('super-hidden');
		}
	};
	
	var DialogView = function() {
		DialogView.super.apply(this, arguments);
		var self = this;
		
		this.elem = document.getElementById('dialog');
		this.contentElem = this.elem.getElementsByClassName('content')[0];
		this.closeElem = this.elem.getElementsByClassName('close')[0];
		this.opened = false;

		this.closeElem.addEventListener('click', function() {
			self.close();
		});
		document.addEventListener('keyup', function(event) {
			if (self.opened && event.keyCode === 27) {
				self.close();
			}
		});
	};
	DialogView.super = View;
	DialogView.prototype = Object.create(View.prototype);
	DialogView.prototype.constructor = DialogView;
	DialogView.prototype.show = function(content) {
		this.elem.classList.remove('hidden');
		this.contentElem.innerHTML = content;
		this.opened = true;
	};
	DialogView.prototype.close = function() {
		this.elem.classList.add('hidden');
		this.contentElem.innerHTML = 'content';
		this.contentElem.scrollLeft = 0;
		this.contentElem.scrollTop = 0;
		this.opened = false;
	};

	var ShareDialogView = function() {
		ShareDialogView.super.apply(this);
		var self = this;

		this.elem = document.getElementById('share-dialog');
		this.boxElem = this.elem.getElementsByClassName('box')[0];
		this.closeElem = this.elem.getElementsByClassName('close')[0];
		this.linkElem = this.elem.getElementsByClassName('link')[0];
		this.opened = false;

		this.elem.addEventListener('click', function() {
			self.close();
		});
		this.boxElem.addEventListener('click', function(event) {
			event.stopPropagation();
		});
		this.closeElem.addEventListener('click', function() {
			self.close();
		});
		this.linkElem.addEventListener('click', function() {
			self.linkElem.select();
		});
		document.addEventListener('keyup', function(event) {
			if (self.opened && event.keyCode === 27) {
				self.close();
			}
		});
	};
	ShareDialogView.super = View;
	ShareDialogView.prototype = Object.create(View.prototype);
	ShareDialogView.prototype.constructor = ShareDialogView;
	ShareDialogView.prototype.show = function(url) {
		this.elem.classList.remove('hidden');
		this.linkElem.value = url;
		this.linkElem.focus();
		this.linkElem.select();
		this.opened = true;
	};
	ShareDialogView.prototype.close = function() {
		this.elem.classList.add('hidden');
		this.opened = false;
	};

	var MessageCounterView = function() {
		MessageCounterView.super.apply(this);
		var self = this;

		this.elem = template.create('message-counter-template', { className: 'message-counter', tagName: 'span' });
		this.countElem = this.elem.getElementsByClassName('count')[0];
		this.messagesInfoElem = this.elem.getElementsByClassName('messages-info')[0];
		this.textElem = this.elem.getElementsByClassName('text')[0];

		this.count = 0;

		var disposeListener = function() {
			self.off('dispose', disposeListener);
		};
		this.on('dispose', disposeListener);
	};
	MessageCounterView.super = View;
	MessageCounterView.prototype = Object.create(View.prototype);
	MessageCounterView.prototype.constructor = MessageCounterView;
	MessageCounterView.prototype.setCount = function(count) {
		this.count = count;
		if (this.count === 0) {
			this.messagesInfoElem.classList.add('hidden');
		} else {
			this.messagesInfoElem.classList.remove('hidden');
			this.countElem.textContent = ['+', this.count].join('');
			this.textElem.textContent = 'unread message' + (this.count == 1 ? '' : 's');
		}
	};
	
	var WallPublicationView = function() {
		WallPublicationView.super.apply(this);
		var self = this;
		
		this.elem = document.getElementById('wall-publication');
		this.cancelElem = this.elem.getElementsByClassName('cancel')[0];
		this.statusElem = this.elem.getElementsByClassName('status')[0];
		
		var cancelElemClickListener = function(event) {
			self.cancel = true;
			self.close();
		};
		
		this.cancelElem.addEventListener('click', cancelElemClickListener);
		
		var disposeListener = function(event) {
			self.off('dispose', disposeListener);
			self.cancelElem.removeEventListener('click', cancelElemClickListener);
		};
	};
	WallPublicationView.super = View;
	WallPublicationView.prototype = Object.create(View.prototype);
	WallPublicationView.prototype.constructor = WallPublicationView;
	WallPublicationView.prototype.show = function(shareUrl) {
		var self = this;
		var currentSession = null;
		this.authorizeVK().then(function(session) {
			self.checkCancelation();
			currentSession = session;
			self.elem.classList.remove('hidden');
			self.statusElem.textContent = 'Getting a VK upload server...';
			return VK.Api.callAsync('photos.getWallUploadServer', { v: 5.9 });
		}).then(function(data) {
			self.checkCancelation();
			if (data.error) {
				throw new Error('couldn\'t get an upload server');
			} else {
				var response = data.response;
				var uploadUrl = response.upload_url;
				self.statusElem.textContent = 'Generating preview...';
				return Promise.all([uploadUrl, self.generatePreview(shareUrl)]);
			}
		}).then(function(values) {
			self.checkCancelation();
			var uploadUrl = values[0];
			var generatedPreview = JSON.parse(values[1]);
			if (generatedPreview.result === 'ok') {
				var baseUrl = 'http://www.bazelevscontent.net:8582/';
				var imageUrl = baseUrl + generatedPreview.image;
				self.statusElem.textContent = 'Uploading preview to VK server...';
				return self.uploadImage(uploadUrl, imageUrl);
			} else {
				throw new Error('couldn\'t generate a preview');
			}
		}).then(function(rawData) {
			self.checkCancelation();
			self.statusElem.textContent = 'Saving preview to wall album...';
			var data = JSON.parse(rawData);
			return VK.Api.callAsync('photos.saveWallPhoto', data);
		}).then(function(data) {
			self.checkCancelation();
			if (data.error) {
				throw new Error('couldn\'t save a preview');
			} else {
				var response = data.response;
				var savedImage = response[0];
				var savedImageId = savedImage.id;
				self.statusElem.textContent = '';
				self.close();
				return VK.Api.callAsync('wall.post', { 
					message: 'My mult-status',
					attachments: [
						savedImageId,
						shareUrl
					]
				});
			}
		}).then(function(data) {
			self.checkCancelation();
			if (data.error) {
				throw new Error('could\'t save a post');
			}
		}).catch(function(error) {
			console.log(error);
			self.close();
		});
	};
	WallPublicationView.prototype.close = function() {
		this.statusElem.textContent = '';
		this.elem.classList.add('hidden');
	};
	WallPublicationView.prototype.authorizeVK = function() {
		return VK.Auth.getLoginStatusAsync().catch(function(error) {
			return VK.Auth.loginAsync(VK.access.FRIENDS | VK.access.PHOTOS);
		});
	};
	WallPublicationView.prototype.generatePreview = function(shareUrl) {
		var requestData = {
			url: shareUrl,
			imageFormat: 'png',
			scale: 1,
			contentType: 'share'
		};
		var rawRequestData = JSON.stringify(requestData);
		var options = {
			url: 'https://www.bazelevscontent.net:8893',
			method: 'POST',
			data: 'type=render&data=' + encodeURIComponent(rawRequestData)
		};
		return requestAsync(options);
	};
	WallPublicationView.prototype.uploadImage = function(uploadUri, imageUri) {
		var requestData = {
			uri: uploadUri,
			file1: imageUri
		};
		var options = {
			url: 'https://wmm-c9-stv909.c9.io',
			method: 'POST',
			data: JSON.stringify(requestData)
		};
		return requestAsync(options);
	};
	WallPublicationView.prototype.checkCancelation = function() {
		if (this.cancel) {
			this.cancel = false;
			throw new Error('canceled');
		}
	};
	
	var MessageIntervalView = function() {
		MessageIntervalView.super.apply(this);
		var self = this;
		
		this.elem = template.create('message-interval-template', { className: 'message-interval', tagName: 'span' });
		this.elem.classList.add('hidden');
		this.intervalSelectElem = this.elem.getElementsByClassName('interval-select')[0];
		
		var intervalSelectElemListener = function(event) {
			var index = self.intervalSelectElem.selectedIndex;
			var option = self.intervalSelectElem[index];
			self.trigger({
				type: 'change:interval',
				value: parseInt(option.value, 10)
			});
		};
		
		this.intervalSelectElem.addEventListener('change', intervalSelectElemListener);
		
		var disposeListener = function(event) {
			self.off('dispose', disposeListener);
			self.intervalSelectElem.removeEventListener('change', intervalSelectElemListener);
		};
	};
	MessageIntervalView.super = View;
	MessageIntervalView.prototype = Object.create(View.prototype);
	MessageIntervalView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	MessageIntervalView.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};
	
	chat.views = {
		ContactView: ContactView,
		AccountView: AccountView,
		ChatboxView: ChatboxView,
		MessageComposerView: MessageComposerView,
		MessageStreamView: MessageStreamView,
		DialogView: DialogView,
		ShareDialogView: ShareDialogView,
		MessageCounterView: MessageCounterView,
		WallPublicationView: WallPublicationView,
		MessageIntervalView: MessageIntervalView
	};
	
})(chat, mvp, template, html);