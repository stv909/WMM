(function(messenger, eve, abyss, template, analytics) {
	
	var UserView = messenger.views.UserView;
	var GroupView = messenger.views.GroupView;
	
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
	
	var DelayedObserver = (function(base) {
		eve.extend(DelayedObserver, base);
		
		function DelayedObserver(value) {
			base.apply(this, arguments);
			
			this.lastValue = value;
			this.lastTimeout = null;
			this.delay = 800;
		}
		
		DelayedObserver.prototype.set = function(value) {
			var self = this;
			if (this.lastTimeout) {
				clearTimeout(this.lastTimeout);
				this.lastTimeout = null;
			}
			if (value !== this.lastValue) {
				this.lastTimeout = setTimeout(function() {
					self.lastValue = value;
					self.trigger({
						type: 'change:value',
						value: self.lastValue
					});
				}, this.delay);
			}
		};
		
		return DelayedObserver;
	})(eve.EventEmitter);
	
	var PostPageView = (function(base) {
		eve.extend(PostPageView, base);
		
		function PostPageView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('post-page-template', { id: 'post-page' });
			this.tabsElem = this.elem.getElementsByClassName('tabs')[0];
			this.friendTabElem = this.tabsElem.getElementsByClassName('friend')[0];
			this.groupTabElem = this.tabsElem.getElementsByClassName('group')[0];
			this.containerElem = this.elem.getElementsByClassName('container')[0];

			this.mode = 'friend';
			this.friendSearchView = new FriendSearchView();
			this.groupSearchView = new GroupSearchView();
			
			var friendTabElemClickListener = function(event) {
				if (self.mode != 'friend') {
					self.setMode('friend');
				}
			};
			var groupTabElemClickListener = function(event) {
				if (self.mode != 'group') {
					self.setMode('group');
				}
			};
			
			this.friendTabElem.addEventListener('click', friendTabElemClickListener);
			this.groupTabElem.addEventListener('click', groupTabElemClickListener);
			
			this.initializeViews();
			this.setMode('friend');
			
			this.once('dispose', function() {
				self.friendSearchView.dispose();
				self.groupSearchView.dispose();
				self.friendTabElem.removeEventListener('click', friendTabElemClickListener);
				self.groupTabElem.removeEventListener('click', groupTabElemClickListener);
			});
		}
		
		PostPageView.prototype.initializeViews = function() {
			this.friendSearchView.attachTo(this.containerElem);
			this.groupSearchView.attachTo(this.containerElem);
		};
		PostPageView.prototype.setMode = function(mode) {
			this.mode = mode;
			
			switch (this.mode) {
				case 'friend':
					this.friendTabElem.classList.remove('normal');
					this.friendTabElem.classList.add('chosen');
					this.groupTabElem.classList.add('normal');
					this.groupTabElem.classList.remove('chosen');
					this.friendSearchView.show();
					this.groupSearchView.hide();
					break;
				case 'group':
					this.friendTabElem.classList.add('normal');
					this.friendTabElem.classList.remove('chosen');
					this.groupTabElem.classList.remove('normal');
					this.groupTabElem.classList.add('chosen');
					this.friendSearchView.hide();
					this.groupSearchView.show();
					break;
				default:
					throw new Error('unsupported mode');
			}
		};
		
		return PostPageView;
	})(PageView);
	
	var SearchView = (function(base) {
		eve.extend(SearchView, base);
		
		function SearchView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('contact-search-template', { className: 'contact-search' });
			this.receiverHolderElem = this.elem.getElementsByClassName('receiver-holder')[0];
			this.sectionElem = this.elem.getElementsByClassName('section')[0];
			this.queryElem = this.elem.getElementsByClassName('query')[0];
			this.searchResultsElem = this.elem.getElementsByClassName('search-results')[0];
		}
		
		return SearchView;
	})(PageView);
	
	var FriendSearchView = (function(base) {
		eve.extend(FriendSearchView, base);
		
		function FriendSearchView() {
			base.apply(this, arguments);
			var self = this;
			
			this.sectionElem.textContent = 'Друг';
			this.queryElem.placeholder = 'Найти друга';
			
			this.userView = new UserView();
			this.userView.attachTo(this.receiverHolderElem);
			this.userView.select();
			
			this.cachedUserViews = {};
			this.userViews = {};
			this.selectedUserView = null;
			
			this.userViewSelectListener = function(event) {
				var target = event.target;
				if (target !== self.selectedUserView) {
					if (self.selectedUserView) {
						self.selectedUserView.deselect();
					}
					self.selectedUserView = target;
					self.userView.setModel(self.selectedUserView.model);
					self.trigger({
						type: 'select:user',
						user: self.selectedUserView.model
					});
				}
			};
			
			this.queryElemObserver = new DelayedObserver(this.queryElem.value);
			this.queryElemObserver.on('change:value', function(event) {
				self.trigger({
					type: 'search:users',
					text: event.value
				});
				analytics.send('friends', 'friends_search');
			});
			
			var queryElemInputListener = function(event) {
				self.queryElemObserver.set(self.queryElem.value);	
			};
			
			this.queryElem.addEventListener('input', queryElemInputListener);
			
			this.once('dispose', function() {
				self.queryElemObserver.off();
				self.queryElem.removeEventListener('input', queryElemInputListener);
			});
		}
		
		FriendSearchView.prototype.clear = function() {
			Object.keys(this.userViews).forEach(function(key) {
				this.userViews[key].detach();	
			}, this);
			this.userViews = {};
		};
		FriendSearchView.prototype.addFriend = function(user) {
			var id = user.get('id');
			var userView = this._getOrCreateUserView(user);
			userView.attachTo(this.searchResultsElem);
			this.userViews[id] = userView;
			if (!this.selectedUserView) {
				userView.select();
			}
		};
		FriendSearchView.prototype._getOrCreateUserView = function(user) {
			var id = user.get('id');
			var userView = this.cachedUserViews[id];
			if (!userView) {
				userView = new UserView(user);
				userView.on('select', this.userViewSelectListener);
				this.cachedUserViews[id] = userView;
			}
			return userView;
		};
		
		return FriendSearchView;
	})(SearchView);
	
	var GroupSearchView = (function(base) {
		eve.extend(GroupSearchView, base);
		
		function GroupSearchView() {
			base.apply(this, arguments);
			var self = this;
			
			this.sectionElem.textContent = 'Сообщество';
			this.queryElem.placeholder = 'Найти сообщество';
			
			this.groupView = new GroupView();
			this.groupView.attachTo(this.receiverHolderElem);
			this.groupView.select();
			
			this.cachedGroupViews = {};
			this.groupViews = {};
			this.selectedGroupView = null;
			
			this.groupViewSelectListener = function(event) {
				var target = event.target;
				if (target !== self.selectedGroupView) {
					if (self.selectedGroupView) {
						self.selectedGroupView.deselect();
					}
					self.selectedGroupView = target;
					self.groupView.setModel(self.selectedGroupView.model);
					self.trigger({
						type: 'select:group',
						group: self.selectedGroupView.model
					});
				}
			};
			
			this.queryElemObserver = new DelayedObserver(this.queryElem.value);
			this.queryElemObserver.on('change:value', function(event) {
				self.trigger({
					type: 'search:groups',
					text: event.value
				});
				analytics.send('friends', 'groups_search');
			});
			
			var queryElemInputListener = function(event) {
				self.queryElemObserver.set(self.queryElem.value);	
			};
			
			this.queryElem.addEventListener('input', queryElemInputListener);
			
			this.once('dispose', function() {
				self.queryElemObserver.off();
				self.queryElem.removeEventListener('input', queryElemInputListener);
			});
		}
		
		GroupSearchView.prototype.clear = function() {
			Object.keys(this.groupViews).forEach(function(key) {
				this.groupViews[key].detach();	
			}, this);
			this.groupViews = {};
		};
		GroupSearchView.prototype.addGroup = function(group) {
			var id = group.get('id');
			var groupView = this._getOrCreateGroupView(group);
			groupView.attachTo(this.searchResultsElem);
			this.groupViews[id] = groupView;
			if (!this.selectedGroupView) {
				groupView.select();
			}
		};
		GroupSearchView.prototype._getOrCreateGroupView = function(group) {
			var id = group.get('id');
			var groupView = this.cachedGroupViews[id];
			if (!groupView) {
				groupView = new GroupView(group);
				groupView.on('select', this.groupViewSelectListener);
				this.cachedGroupViews[id] = groupView;
			}
			return groupView;
		};
		
		return GroupSearchView;
	})(SearchView);
	
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
})(messenger || (messenger = {}), eve, abyss, template, analytics);