(function(messenger, eve, abyss) {
	
	var ConversationView = (function(base) {
		eve.extend(ConversationView, base);
		
		function ConversationView() {
			base.apply(this, arguments);
			var self = this;

			this.elem = eye.template({
				templateId: 'conversation-template',
				className: 'conversation'
			});
			this.elem.classList.add('hidden');

			this.tapePageClickHintListener = function() {
				self.trigger('click:hint');
			};
			this.tapePageClickAnswerListener = function(event) {
				self.trigger({
					type: 'click:answer',
					message: event.message
				});
			};
			this.tapePageClickWallListener = function(event) {
				self.trigger({
					type: 'click:wall',
					message: event.message
				});
			};

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
				tapeView.on('click:hint', this.tapePageClickHintListener);
				tapeView.on('click:answer', this.tapePageClickAnswerListener);
				tapeView.on('click:wall', this.tapePageClickWallListener);
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

			this.elem = eye.template({
				templateId: 'tape-page-template',
				className: 'tape-page'
			});
			this.containerElem = this.elem.getElementsByClassName('container')[0];
			this.teaserElem = this.elem.getElementsByClassName('teaser')[0];
			this.crossElem = this.teaserElem.getElementsByClassName('cross')[0];
			this.firstMessageElem = this.elem.getElementsByClassName('first-message')[0];
			this.sendElem = this.firstMessageElem.getElementsByClassName('send')[0];
			this.contactId = contactId;
			
			this.tapeItemViews = {};
			this.newTapeItems = [];

			this.selectedMessagePatternView = null;
			this.selectMessageSelectListener = function(event) {
				if (event.target !== self.selectedMessagePatternView) {
					if (self.selectedMessagePatternView) {
						self.selectedMessagePatternView.deselect();
					}
					self.selectedMessagePatternView = event.target;
				}
			};
			this.answerMessageListener = function(event) {
				self.trigger({
					type: 'click:answer',
					message: event.message
				});
			};
			this.wallMessageListener = function(event) {
				self.trigger({
					type: 'click:wall',
					message: event.message
				});
			};

			this.hideTeaser = function() {
				self.teaserElem.classList.add('hidden');
				self.containerElem.classList.remove('shifted');
			};
			this.hideFirstMessage = function() {
				self.firstMessageElem.classList.add('hidden');
			};
			
			this.addTapeItemHandler = this.addHiddenTapeItem;
			
			var wheelListener = function(event) {
				var delta = (event.wheelDelta) ? -event.wheelDelta : event.detail;
				var isIE = Math.abs(delta) >= 120;
				var scrollPending = isIE ? delta / 2 : 0;
				if (delta < 0 && (self.containerElem.scrollTop + scrollPending) <= 0) {
					self.containerElem.scrollTop = 0;
					event.preventDefault();
				}
				else if (delta > 0 && (self.containerElem.scrollTop + scrollPending >= (self.containerElem.scrollHeight - self.containerElem.offsetHeight))) {
					self.containerElem.scrollTop = self.containerElem.scrollHeight - self.containerElem.offsetHeight;
					event.preventDefault();
				}
			};
			
			this.elem.addEventListener('DOMMouseScroll', wheelListener, false);
			this.elem.addEventListener('mousewheel', wheelListener, false);
			this.crossElem.addEventListener('click', function() {
				self.hideTeaser();
				event.stopPropagation();
				event.preventDefault();
			});
			this.teaserElem.addEventListener('click', function() {
				//self.trigger('click:hint');
			});
			this.sendElem.addEventListener('click', function() {
				self.trigger('click:hint');
			});
		}
		
		TapePageView.prototype.addTapeItem = function(chatMessage, contact) {
			this.addTapeItemHandler(chatMessage, contact);
		};
		TapePageView.prototype.addNormalTapeItem = function(chatMessage, contact) {
			var messageId = chatMessage.get('id');
			var tapeItemView = new TapeItemView(chatMessage, contact);
			tapeItemView.attachFirstTo(this.containerElem);
			tapeItemView.on('select:message', this.selectMessageSelectListener);
			tapeItemView.on('click:answer', this.answerMessageListener);
			tapeItemView.on('click:wall', this.wallMessageListener);

			this.tapeItemViews[messageId] = tapeItemView;
			this.hideTeaser();
			this.hideFirstMessage();
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

			this.elem = eye.template({
				templateId: 'tape-item-template',
				className: 'tape-item'
			});
			this.contactHolderElem = this.elem.getElementsByClassName('contact-holder')[0];
			this.messageHolderElem = this.elem.getElementsByClassName('message-holder')[0];
			this.controlsHolderElem = this.elem.getElementsByClassName('controls-holder')[0];
			this.answerElem = this.elem.getElementsByClassName('answer')[0];
			this.answerElem.classList.add('hidden');
			
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
			var self = this;
			this.controlsView = new messenger.ui.MessageControlsView(this.chatMessage);
			this.controlsView.attachTo(this.controlsHolderElem);

			if (this.chatMessage.isMult()) {
				this.contactView = new messenger.ui.UserView(this.contact, true);
				this.contactView.disableUnreadCounter();
				this.contactView.disableSelecting();
				this.contactView.attachFirstTo(this.contactHolderElem);

				this.controlsView.on('click:wall', function() {
					self.trigger({
						type: 'click:wall',
						message: self.chatMessage
					});
				});
				this.controlsView.on('click:answer', function() {
					self.trigger({
						type: 'click:answer',
						message: self.chatMessage
					});
				});
				this.controlsView.hideUrlButton();
				this.messageView = new messenger.ui.MessagePatternView(this.chatMessage);
				this.messageView.on('select', function(event) {
					self.trigger({
						type: 'select:message',
						target: event.target
					});
				});
				this.messageView.attachTo(this.messageHolderElem);
			} else {
				this.contactView = new messenger.ui.TextUserView(this.contact);
				this.contactView.attachTo(this.contactHolderElem);
				
				this.messageView = new messenger.ui.TextMessageView(this.chatMessage);
				this.messageView.attachTo(this.messageHolderElem);

				this.controlsView.hideAnswerButton();
				this.controlsView.hideWallButton();
				this.controlsView.hideUrlButton();
			}
		};
		
		return TapeItemView;
	})(abyss.View);
	
	messenger.views = messenger.views || {};
	messenger.views.ConversationView = ConversationView;
	
})(messenger, eve, abyss);