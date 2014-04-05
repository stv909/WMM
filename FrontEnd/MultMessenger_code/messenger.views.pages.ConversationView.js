(function(messenger, eve, abyss, template) {
	
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
			
			this.elem = template.create('tape-page-template', { className: 'tape-page' });
			this.contactId = contactId;
			
			this.tapeItemViews = {};
			this.newTapeItems = [];
			
			this.addTapeItemHandler = this.addHiddenTapeItem;
		}
		
		TapePageView.prototype.addTapeItem = function(chatMessage, contact) {
			this.addTapeItemHandler(chatMessage, contact);
		};
		TapePageView.prototype.addNormalTapeItem = function(chatMessage, contact) {
			var messageId = chatMessage.get('id');
			var tapeItemView = new TapeItemView(chatMessage, contact);
			tapeItemView.attachTo(this.elem);
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
			
			this.elem = template.create('tape-item-template', { className: 'tape-item' });
			this.contactHolderElem = this.elem.getElementsByClassName('contact-holder')[0];
			this.messageHolderElem = this.elem.getElementsByClassName('message-holder')[0];
			this.controlsHolderElem = this.elem.getElementsByClassName('controls-holder')[0];
		}
		
		return TapeItemView;
	})(abyss.View);
	
	messenger.views = messenger.views || {};
	messenger.views.ConversationView = ConversationView;
	
})(messenger, eve, abyss, template);