(function(messenger, eve, abyss, template, settings) {
	
	var ConversationView = (function(base) {
		eve.extend(ConversationView, base);
		
		function ConversationView() {
			base.apply(this, arguments);
			
			this.elem = document.createElement('div');
			this.elem.classList.add('conversation');
			this.elem.classList.add('hidden');
			
			this.cachedTapeViews = {};
			this.currentTapeView = null;
		}
		
		ConversationView.prototype.show = function() {
			base.prototype.show.apply(this, arguments);
			this.trigger('show');
		};
		
		ConversationView.prototype.switchMessageTape = function(contactId) {
			var cachedTapeView = this._getOrCreateMessageTape(contactId);
			if (cachedTapeView !== this.currentTapeView) {
				if (this.currentTapeView) {
					this.currentTapeView.detach();
					this.currentTapeView = null;
				}
				this.currentTapeView = cachedTapeView;
				this.currentTapeView.attachTo(this.elem);
			}
		};
		
		ConversationView.prototype._getOrCreateMessageTape = function(contactId) {
			var tapeView = this.cachedTapeViews[contactId];
			if (!tapeView) {
				tapeView = new TapePageView(contactId);
				this.cachedTapeViews[contactId] = tapeView;
			}
			return tapeView;
		};
		
		ConversationView.prototype.addTapeItem = function(contactId, chatMessage, senderContact) {
			var tapeView = this._getOrCreateMessageTape(contactId);
			tapeView.addTapeItem(chatMessage, senderContact);
		}; 
		
		return ConversationView;
	})(messenger.views.PageView);
	
	var TapePageView = (function(base) {
		eve.extend(TapePageView, base);
		
		function TapePageView(contactId) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('tape-page-template', { className: 'tape-page' });
			this.contactId = contactId;
			
			this.tapeItemViews = {};
			this.newTapeItems = [];
			
			this.addTapeItemHandler = this.addHiddenTapeItem;
			
			var wheelListener = function(event) {
	            var delta = (event.wheelDelta) ? -event.wheelDelta : event.detail;
	            var isIE = Math.abs(delta) >= 120;
	            var scrollPending = isIE ? delta / 2 : 0;
	            if (delta < 0 && (self.elem.scrollTop + scrollPending) <= 0) {
					self.elem.scrollTop = 0;
					event.preventDefault();
	            }
	            else if (delta > 0 && (self.elem.scrollTop + scrollPending >= (self.elem.scrollHeight - self.elem.offsetHeight))) {
					self.elem.scrollTop = self.elem.scrollHeight - self.elem.offsetHeight;
					event.preventDefault();
	            }
			};
			
			this.elem.addEventListener('DOMMouseScroll', wheelListener, false);
			this.elem.addEventListener('mousewheel', wheelListener, false);
		}
		
		TapePageView.prototype.addTapeItem = function(chatMessage, contact) {
			this.addTapeItemHandler(chatMessage, contact);
		};
		TapePageView.prototype.addNormalTapeItem = function(chatMessage, contact) {
			var messageId = chatMessage.get('id');
			var tapeItemView = new TapeItemView(chatMessage, contact);
			tapeItemView.attachFirstTo(this.elem);
			this.tapeItemViews[messageId] = tapeItemView;
		};
		TapePageView.prototype.addHiddenTapeItem = function(chatMessage, contact) {
			this.newTapeItems.push({
				chatMessage: chatMessage,
				contact: contact
			});
		};
		TapePageView.prototype.renderNewTapeItems = function() {
			this.newTapeItems.forEach(function(tapeItem) {
				this.addNormalTapeItem(tapeItem.chatMessage, tapeItem.contact);
			}, this);
			this.newTapeItems = [];
		};
		
		TapePageView.prototype.attachTo = function(elem) {
			base.prototype.attachTo.call(this, elem);
			this.addTapeItemHandler = this.addNormalTapeItem;
			this.renderNewTapeItems();
		};
		TapePageView.prototype.detach = function() {
			base.prototype.detach.apply(this, arguments);
			this.addTapeItemHandler = this.addHiddenTapeItem;
		};
		
		return TapePageView;
	})(abyss.View);
	
	var TapeItemView = (function(base) {
		eve.extend(TapeItemView, base);
		
		function TapeItemView(chatMessage, contact) {
			base.apply(this, arguments);
			var self = this;
			
			this.chatMessage = chatMessage;
			this.contact = contact;
			
			this.elem = template.create('tape-item-template', { className: 'tape-item' });
			this.contactHolderElem = this.elem.getElementsByClassName('contact-holder')[0];
			this.messageHolderElem = this.elem.getElementsByClassName('message-holder')[0];
			this.controlsHolderElem = this.elem.getElementsByClassName('controls-holder')[0];
			this.answerElem = this.elem.getElementsByClassName('answer')[0];
			
			this.contactView = null;
			this.messageView = null;
			this.controlsView = null;
			
			this.initializeViews();
			
			if (!this.chatMessage.get('shown')) {
				this.elem.classList.add('unshown');
				var elemMouseMoveListener = function() {
					self.chatMessage.set('shown', true);
					self.elem.classList.remove('unshown');
					self.elem.removeEventListener('mousemove', elemMouseMoveListener);
				};
				this.elem.addEventListener('mousemove', elemMouseMoveListener);
			}
			if (this.chatMessage.get('own')) {
				this.elem.classList.add('own');
			}
			
			this.once('dispose', function() {
				self.contactView.dispose();
				self.messageView.dispose();
				self.controlsView.dispose();
			});
		}
		
		TapeItemView.prototype.initializeViews = function() {
			this.controlsView = new MessageControlsView(this.chatMessage);
			this.controlsView.attachTo(this.controlsHolderElem);
			
			if (this.chatMessage.isMult()) {
				this.contactView = new messenger.views.UserView(this.contact, true);
				this.contactView.disableUnreadCounter();
				this.contactView.disableSelecting();
				this.contactView.attachFirstTo(this.contactHolderElem);
				
				this.answerElem.classList.remove('hidden');
				this.messageView = new messenger.views.MessagePatternView(this.chatMessage);
				this.messageView.attachTo(this.messageHolderElem);
			} else {
				this.contactView = new TextUserView(this.contact);
				this.contactView.attachTo(this.contactHolderElem);
				
				this.messageView = new TextMessageView(this.chatMessage);
				this.messageView.attachTo(this.messageHolderElem);

				this.controlsView.hideWallButton();
				this.controlsView.hideUrlButton();
			}
		};
		
		return TapeItemView;
	})(abyss.View);
	
	var MessageControlsView = (function(base) {
		eve.extend(MessageControlsView, base);
		
		function normalizeNumber(number) {
			if (number >= 10) {
				return number.toString();
			} else {
				return ['0', number].join('');
			}
		}
		function formatDate(timestamp) {
			var date = new Date(timestamp);
		
			var day = normalizeNumber(date.getUTCDate());
			var month = normalizeNumber(date.getMonth() + 1);
			var year = normalizeNumber(date.getFullYear() - 2000);
		
			var hours = normalizeNumber(date.getHours());
			var minutes = normalizeNumber(date.getMinutes());
		
			var dateChunks = [day, '.', month, '.', year, ' ', hours, ':', minutes];
			return dateChunks.join('');
		}
		
		function MessageControlsView(message) {
			base.apply(this, arguments);
			var self = this;
			
			this.message = message;
			
			this.elem = template.create('message-controls-template', { className: 'message-controls' });
			this.timeElem = this.elem.getElementsByClassName('time')[0];
			this.wallElem = this.elem.getElementsByClassName('wall')[0];
			this.urlElem = this.elem.getElementsByClassName('url')[0];
			
			this.updateTimeElem();
			
			var wallElemClickListener = function(event) {
				self.trigger('click:wall');	
			};
			var urlElemClickListener = function(event) {
				self.trigger('click:url');
			};
			
			this.wallElem.addEventListener('click', wallElemClickListener);
			this.urlElem.addEventListener('click', urlElemClickListener);
			
			this.once('dispose', function() {
				self.wallElem.removeEventListener('click', wallElemClickListener);
				self.urlElem.removeEventListener('click', urlElemClickListener);
			});
		}
		
		MessageControlsView.prototype.hideWallButton = function() {
			this.wallElem.classList.add('hidden');
		};
		MessageControlsView.prototype.hideUrlButton = function() {
			this.urlElem.classList.add('hidden');
		};
		MessageControlsView.prototype.updateTimeElem = function() {
			var timestamp = this.message.get('timestamp');
			var self = this;
			if (timestamp) {
				this.timeElem.textContent = formatDate(timestamp);
			} else {
				this.timeElem.textContent = 'Отправка...';
				this.message.once('change:timestamp', function(event) {
					var timestamp = event.value;
					self.timeElem.textContent = formatDate(timestamp);
				});
			}
			
		};
		
		return MessageControlsView;
	})(abyss.View);
	
	var CreateMessageDialogView = (function(base) {
		eve.extend(CreateMessageDialogView, base);
		
		function CreateMessageDialogView() {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById('create-message-dialog');
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			this.sendElem = this.dialogWindowElem.getElementsByClassName('send')[0];
			this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];
			this.messageTextElem = this.dialogWindowElem.getElementsByClassName('message-text')[0];
			
			var emptyStringPattern = /^\s*$/;
			var cancelClickListener = function() {
				self.hide();
				self.messageTextElem.value = '';
				self.sendElem.classList.add('disabled');
			};
			var sendClickListener = function() {
				var value = self.messageTextElem.value;
				if (!emptyStringPattern.test(value)) {
					self.trigger({
						type: 'click:send',
						text: value.replace(/\r?\n/g, '<br />')
					});
					self.hide();
					self.messageTextElem.value = '';
					self.sendElem.classList.add('disabled');
				}
			};
			var messageTextInputListener = function() {
				if (emptyStringPattern.test(self.messageTextElem.value)) {
					self.sendElem.classList.add('disabled');
				} else {
					self.sendElem.classList.remove('disabled');
				}
			};
			
			this.crossElem.addEventListener('click', cancelClickListener);
			this.cancelElem.addEventListener('click', cancelClickListener);
			this.sendElem.addEventListener('click', sendClickListener);
			this.messageTextElem.addEventListener('input', messageTextInputListener);
		}
		
		CreateMessageDialogView.prototype.show = function() {
			base.prototype.show.apply(this, arguments);
			this.messageTextElem.focus();
		};
		
		return CreateMessageDialogView;
	})(messenger.views.DialogView);
	
	var TextMessageView = (function(base) {
		eve.extend(TextMessageView, base);
		
		function TextMessageView(chatMessage) {
			base.apply(this, arguments);
			
			this.elem = template.create('text-message-template', { className: 'text-message' });
			this.contentElem = this.elem.getElementsByClassName('content')[0];
			
			this.contentElem.innerHTML = chatMessage.get('content');
		}
		
		return TextMessageView;
	})(abyss.View);
	
	var TextUserView = (function(base) {
		eve.extend(TextUserView, base);
		
		function TextUserView(user) {
			base.apply(this, arguments);
			var self = this;
			
			this.model = user;
			
			this.elem = template.create('text-user-template', { className: 'text-user' });
			this.nameElem = this.elem.getElementsByClassName('name')[0];
			this.nameElem.textContent = this.model.getFullName();

			var updateOnlineStatus = function(online) {
				if (online) {
					self.elem.classList.remove('offline');
				} else {
					self.elem.classList.add('offline');
				}
			};
			var nameElemClickListener = function() {
				var id = self.model.get('id');
				var vkLink = [settings.vkContactBaseUrl, id].join('');
				window.open(vkLink, '_blank');
			};
			
			this.model.on('change:online', function(event) {
				updateOnlineStatus(event.value);
			});
			updateOnlineStatus(this.model.get('online'));
			
			this.nameElem.addEventListener('click', nameElemClickListener);
		}
		
		return TextUserView;
	})(abyss.View);
	
	messenger.views = messenger.views || {};
	messenger.views.ConversationView = ConversationView;
	messenger.views.CreateMessageDialogView = CreateMessageDialogView;
	
})(messenger, eve, abyss, template, settings);