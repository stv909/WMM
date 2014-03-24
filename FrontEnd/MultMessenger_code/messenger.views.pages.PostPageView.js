(function(messenger, eve, abyss, template) {
	
	var PageView = (function(base) {
		eve.extend(PageView, base);
		
		function PageView() {
			base.apply(this, arguments);
		}
		
		PageView.prototype.show = function() {
			this.elem.classList.remove('hidden');	
		};
		
		PageView.prototype.hide = function() {
			this.elem.classList.add('hidden');
		};
		
		return PageView;
	})(abyss.View);
	
	var PostPageView = (function(base) {
		eve.extend(PostPageView, base);
		
		function PostPageView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('post-page-template', { id: 'post-page' });
			this.contactsElem = this.elem.getElementsByClassName('contacts')[0];
			this.receiverHolderElem = this.elem.getElementsByClassName('receiver-holder')[0];
			this.queryElem = this.elem.getElementsByClassName('query')[0];
			
			this.mode = 'friends';
			this.friendSearchView = new FriendSearchView();
			this.groupSearchView = new GroupSearchView();
			
			this.initializeViews();
		}
		
		PostPageView.prototype.initializeViews = function() {
			
		};
		PostPageView.prototype.setMode = function(mode) {
			this.mode = mode;
			
			switch (this.mode) {
				case 'friends':
					this.friendSearchView.show();
					this.groupSearchView.hide();
					break;
				case 'groups':
					this.friendSearchView.hide();
					this.groupSearchView.show();
					break;
				default:
					throw new Error('unsupported mode');
			}
		};
		
		return PostPageView;
	})(PageView);
	
	var FriendSearchView = (function(base) {
		eve.extend(FriendSearchView, base);
		
		function FriendSearchView() {
			base.apply(this, arguments);
		}
		
		return FriendSearchView;
	})(PageView);
	
	var GroupSearchView = (function(base) {
		eve.extend(GroupSearchView, base);
		
		function GroupSearchView() {
			base.apply(this, arguments);
		}
		
		return GroupSearchView;
	})(PageView);
	
	messenger.views = messenger.views || {};
	messenger.views.PostPageView = PostPageView;
	
	// 	var PostPageView = function() {
	// 	PostPageView.super.apply(this);
	// 	var self = this;

	// 	this.elem = template.create('post-page-template', { id: 'post-page' });
	// 	this.contactsElem = this.elem.getElementsByClassName('contacts')[0];
	// 	this.receiverHolderElem = this.elem.getElementsByClassName('receiver-holder')[0];
	// 	this.loadElem = this.elem.getElementsByClassName('load')[0];
	// 	this.loadHolderElem = this.elem.getElementsByClassName('load-holder')[0];
	// 	this.queryElem = this.elem.getElementsByClassName('query')[0];
	// 	this.searchResultsElem = this.elem.getElementsByClassName('search-results')[0];
	// 	this.searchResultsWrapElem = this.searchResultsElem.getElementsByClassName('wrap')[0];

	// 	this.cachedContactViews = {};
	// 	this.contactViews = {};
	// 	this.selectedContactView = null;
	// 	this.receiverContactView = new ContactView();
	// 	this.receiverContactView.attachTo(this.receiverHolderElem);
	// 	this.receiverContactView.select();
		
	// 	this.loadElemEnable = true;
		
	// 	this.contactViewSelectListener = function(event) {
	// 		var target = event.target;
	// 		if (target !== self.selectedContactView) {
	// 			if (self.selectedContactView) {
	// 				self.selectedContactView.deselect();
	// 			}
	// 			self.selectedContactView = target;
	// 			self._setReceiver(self.selectedContactView.model);
	// 			self.trigger({
	// 				type: 'select:contact',
	// 				contact: self.selectedContactView.model
	// 			});
	// 		}
	// 	};
		
	// 	var loadElemClickListener = function(event) {
	// 		if (self.loadElemEnable) {
	// 			self.trigger('click:load');
	// 			analytics.send('friends', 'friends_load_more');
	// 		}
	// 	};
	// 	var lastQueryText = this.queryElem.value;
	// 	var lastQueryTimeout = null;
	// 	var queryElemInputListener = function(event) {
	// 		var queryText = self.queryElem.value;
	// 		if (lastQueryTimeout) {
	// 			clearTimeout(lastQueryTimeout);
	// 			lastQueryTimeout = null;
	// 		}
	// 		if (lastQueryText !== queryText) {
	// 			lastQueryTimeout = setTimeout(function() {
	// 				lastQueryText = queryText;
	// 				self.trigger({
	// 					type: 'update:search',
	// 					text: queryText
	// 				});
	// 				analytics.send('friends', 'friends_search');
	// 			}, 800);
	// 		}
	// 	};
	// 	var wheelListener = function(event) {
	// 		var delta = (event.wheelDelta) ? -event.wheelDelta : event.detail;
 //           var isIE = Math.abs(delta) >= 120;
 //           var scrollPending = isIE ? delta / 2 : 0;
 //           if (delta < 0 && (self.searchResultsWrapElem.scrollTop + scrollPending) <= 0) {
	// 			self.searchResultsWrapElem.scrollTop = 0;
	// 			event.preventDefault();
 //           }
 //           else if (delta > 0 && (self.searchResultsWrapElem.scrollTop + scrollPending >= (self.searchResultsWrapElem.scrollHeight - self.searchResultsWrapElem.offsetHeight))) {
	// 			self.searchResultsWrapElem.scrollTop = self.searchResultsWrapElem.scrollHeight - self.searchResultsWrapElem.offsetHeight;
	// 			event.preventDefault();
 //           }
	// 	};
		
	// 	this.loadElem.addEventListener('click', loadElemClickListener);
	// 	this.queryElem.addEventListener('input', queryElemInputListener);
	// 	this.searchResultsWrapElem.addEventListener('DOMMouseScroll', wheelListener, false);
	// 	this.searchResultsWrapElem.addEventListener('mousewheel', wheelListener, false);
		
	// 	this.once('dispose', function(event) {
	// 		self.loadElem.removeEventListener('click', loadElemClickListener);
	// 		self.queryElem.removeEventListener('input', queryElemInputListener);
	// 		self.searchResultsWrapElem.addEventListener('DOMMouseScroll', wheelListener);
	// 		self.searchResultsWrapElem.addEventListener('mousewheel', wheelListener);
	// 	});

	// 	this.hide();
	// };
	// PostPageView.super = View;
	// PostPageView.prototype = Object.create(View.prototype);
	// PostPageView.prototype.constructor = PostPageView;
	// PostPageView.prototype.show = function() {
	// 	this.elem.classList.remove('hidden');
	// };
	// PostPageView.prototype.hide = function() {
	// 	this.elem.classList.add('hidden');
	// };
	// PostPageView.prototype.showContact = function(contact) {
	// 	var contactId = contact.get('id');
	// 	var contactView = this._getOrCreateContactView(contact);
	// 	contactView.attachTo(this.contactsElem);
	// 	contactView.on('select', this.contactViewSelectListener);
	// 	this.contactViews[contactId] = contactView;
	// 	if (!this.selectedContactView) {
	// 		contactView.select();
	// 	}
	// };
	// PostPageView.prototype.selectContact = function(contact) {
	// 	var contactView = this._getOrCreateContactView(contact);
	// 	contactView.select();
	// };
	// PostPageView.prototype._setReceiver = function(contact) {
	// 	this.receiverContactView.setModel(contact);
	// };
	// PostPageView.prototype.clear = function() {
	// 	var self = this;
	// 	Object.keys(this.contactViews).forEach(function(key) {
	// 		self.contactViews[key].detach();	
	// 	});
	// 	this.contactViews = {};
	// };
	// PostPageView.prototype.enableContactLoading = function() {
	// 	this.loadElemEnable = true;
	// 	this.loadElem.textContent = 'Загрузить еще...';
	// };
	// PostPageView.prototype.disableContactLoading = function() {
	// 	this.loadElemEnable = false;
	// 	this.loadElem.textContent = 'Загрузка...';
	// };
	// PostPageView.prototype.hideContactLoading = function() {
	// 	this.loadHolderElem.classList.add('hidden');
	// };
	// PostPageView.prototype.showContactLoading = function() {
	// 	this.loadHolderElem.classList.remove('hidden');	
	// };
	// PostPageView.prototype._getOrCreateContactView = function(contact) {
	// 	var contactId = contact.get('id');
	// 	var contactView = this.cachedContactViews[contactId];
	// 	if (!contactView) {
	// 		contactView = new ContactView(contact);
	// 		this.cachedContactViews[contactId] = contactView;
	// 	}
	// 	return contactView;
	// };
})(messenger || (messenger = {}), eve, abyss, template);