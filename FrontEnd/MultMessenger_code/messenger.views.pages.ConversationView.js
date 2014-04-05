(function(messenger, eve, template) {
	
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
		
		ConversationView.prototype.switchMessagesTape = function(contactId) {
			
		};
		
		ConversationView.prototype.renderMessagesTape = function(vkid) {
			
		};
		
		ConversationView.prototype.hasMessageTape = function(vkid) {
			return this.cachedTapeViews.hasOwnProperty(vkid);
		};
		
		ConversationView.prototype._getOrCreateMessagesTape = function() {
			
		};
		
		return ConversationView;
	})(messenger.views.PageView);
	
	var TapePageView = (function(base) {
		eve.extend(TapePageView, base);
		
		function TapePageView() {
			base.apply(this, arguments);
			
			this.elem = template.create('tape-page-template', { id: 'tape-page' });
		}
		
		return TapePageView;
	})(messenger.views.PageView);
	
	messenger.views = messenger.views || {};
	messenger.views.ConversationView = ConversationView;
	
})(messenger, eve, template);