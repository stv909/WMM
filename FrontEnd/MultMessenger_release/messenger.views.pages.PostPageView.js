(function(messenger, eve, abyss, template, analytics) {
	
	var PageView = messenger.views.PageView;
	var UserView = messenger.ui.UserView;
	var GroupView = messenger.ui.GroupView;
	
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
			
			this.elem = template.create('post-page-template', { id: 'post-page', className: 'hidden' });
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
			//this.hide();
			
			this.once('dispose', function() {
				self.friendSearchView.dispose();
				self.groupSearchView.dispose();
				self.friendTabElem.removeEventListener('click', friendTabElemClickListener);
				self.groupTabElem.removeEventListener('click', groupTabElemClickListener);
			});
		}
		
		PostPageView.prototype.initializeViews = function() {
			var self = this;
			this.friendSearchView.attachTo(this.containerElem);
			this.groupSearchView.attachTo(this.containerElem);
			this.groupSearchView.on('click:send', function() {
				self.trigger('click:send');
			});
			this.friendSearchView.on('click:send', function() {
				self.trigger('click:send');
			});
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
		PostPageView.prototype.disableGroupTab = function() {
			this.groupTabElem.classList.add('hidden');
		};
		
		return PostPageView;
	})(PageView);
	
	var LobbyView = (function(base) {
		eve.extend(LobbyView, base);
		
		function LobbyView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = eye.template({
				templateId: 'lobby-template',
				id: 'lobby',
				className: 'shifted'
			});
			this.containerElem = this.elem.getElementsByClassName('container')[0];
			this.queryElem = this.elem.getElementsByClassName('query')[0];
			this.contactsHolderElem = this.elem.getElementsByClassName('contacts-holder')[0];
			this.contactsElem = this.elem.getElementsByClassName('contacts')[0];
			this.teaserElem = this.elem.getElementsByClassName('teaser')[0];
			this.crossElem = this.teaserElem.getElementsByClassName('cross')[0];
			
			this.cachedUserViews = {};
			this.userViews = {};
			
			this.hide();
			
			this.queryElemObserver = new DelayedObserver(this.queryElem.value);
			this.queryElemObserver.on('change:value', function(event) {
				self.trigger({
					type: 'search:users',
					text: event.value
				});
				analytics.send('dialog', 'dialog_friend_search');
			});
			
			this.cachedUserViews = {};
			this.userViews = {};
			this.selectedUserView = null;

			var hideTeaser = function() {
				self.containerElem.classList.remove('shifted');
				self.teaserElem.classList.add('hidden');
			};
			
			this.userViewSelectListener = function(event) {
				var target = event.target;
				var options = event.options;
				if (target !== self.selectedUserView) {
					if (self.selectedUserView) {
						self.selectedUserView.deselect();
					}
					self.selectedUserView = target;
					self.trigger({
						type: 'select:user',
						user: self.selectedUserView.model,
						options: options
					});
				}
			};
			this.userViewForceSelectListener = function(event) {
				var target = event.target;
				hideTeaser();
				self.trigger({
					type: 'select-force:user',
					user: target.model
				});
			};
			
			var wheelListener = function(event) {
				var delta = (event.wheelDelta) ? -event.wheelDelta : event.detail;
				var isIE = Math.abs(delta) >= 120;
				var scrollPending = isIE ? delta / 2 : 0;
				if (delta < 0 && (self.contactsHolderElem.scrollTop + scrollPending) <= 0) {
					self.contactsHolderElem.scrollTop = 0;
					event.preventDefault();
				}
				else if (delta > 0 && (self.contactsHolderElem.scrollTop + scrollPending >= (self.contactsHolderElem.scrollHeight - self.contactsHolderElem.offsetHeight))) {
					self.contactsHolderElem.scrollTop = self.contactsHolderElem.scrollHeight - self.contactsHolderElem.offsetHeight;
					event.preventDefault();
				}
			};
			var queryElemInputListener = function(event) {
				self.queryElemObserver.set(self.queryElem.value);	
			};
//			var loadElemClickListener = function(event) {
//				self.trigger('click:load');
//				analytics.send('dialog', 'dialog_friend_load_more');
//			};
			var scrollListener = function() {
				if (self.contactsHolderElem.offsetHeight + self.contactsHolderElem.scrollTop >= self.contactsHolderElem.scrollHeight) {
					self.trigger('click:load');
				}
			};
			
			this.queryElem.addEventListener('input', queryElemInputListener);
			this.contactsHolderElem.addEventListener('DOMMouseScroll', wheelListener, false);
			this.contactsHolderElem.addEventListener('mousewheel', wheelListener, false);
			this.contactsHolderElem.addEventListener('scroll', scrollListener);
			this.crossElem.addEventListener('click', hideTeaser);
			
			this.once('dispose', function() {
				self.queryElemObserver.off();
				self.queryElem.removeEventListener('input', queryElemInputListener);
				self.contactsHolderElem.removeEventListener('DOMMouseScroll', wheelListener);
				self.contactsHolderElem.removeEventListener('mousewheel', wheelListener);
				this.contactsHolderElem.removeEventListener('scroll', scrollListener);
				self.crossElem.removeEventListener('click', hideTeaser);
			});
		}
		
		LobbyView.prototype.show = function() {
			base.prototype.show.apply(this, arguments);
			this.trigger('show');
		};
		LobbyView.prototype.addUser = function(user) {
			var id = user.get('id');
			var userView = this._getOrCreateUserView(user);
			userView.attachTo(this.contactsElem);
			this.userViews[id] = userView;
		};
		LobbyView.prototype.selectUser = function(user) {
			var userView = this._getOrCreateUserView(user);
			userView.select('persist');
		};
		LobbyView.prototype._getOrCreateUserView = function(user) {
			var id = user.get('id');
			var userView = this.cachedUserViews[id];
			if (!userView) {
				userView = new UserView(user, true);
				userView.on('select', this.userViewSelectListener);
				userView.on('select-force', this.userViewForceSelectListener);
				userView.setAnalytic(function() {
					analytics.send('dialog', 'dialog_friend_select');
				});
				this.cachedUserViews[id] = userView;
			}
			return userView;
		};
		LobbyView.prototype.clear = function() {
			Object.keys(this.userViews).forEach(function(key) {
				this.userViews[key].detach();
			}, this);
			this.userViews = {};
			this.contactsHolderElem.scrollTop = 0;
		};
		LobbyView.prototype.updateUserSearch = function() {
			this.trigger({
				type: 'search:users',
				text: this.queryElem.value
			});
		};
		
		return LobbyView;
	})(PageView);
	
	var SearchView = (function(base) {
		eve.extend(SearchView, base);
		
		function SearchView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('contact-search-template', { className: 'contact-search' });
			this.receiverHolderElem = this.elem.getElementsByClassName('receiver-holder')[0];
			this.sendElem = this.elem.getElementsByClassName('send')[0];
			this.sectionElem = this.elem.getElementsByClassName('section')[0];
			this.queryElem = this.elem.getElementsByClassName('query')[0];
			this.searchResultsElem = this.elem.getElementsByClassName('search-results')[0];
			this.wrapperElem = this.elem.getElementsByClassName('wrapper')[0];

			var wheelListener = function(event) {
				var delta = (event.wheelDelta) ? -event.wheelDelta : event.detail;
				var isIE = Math.abs(delta) >= 120;
				var scrollPending = isIE ? delta / 2 : 0;
				if (delta < 0 && (self.wrapperElem.scrollTop + scrollPending) <= 0) {
					self.wrapperElem.scrollTop = 0;
					event.preventDefault();
				}
				else if (delta > 0 && (self.wrapperElem.scrollTop + scrollPending >= (self.wrapperElem.scrollHeight - self.wrapperElem.offsetHeight))) {
					self.wrapperElem.scrollTop = self.wrapperElem.scrollHeight - self.wrapperElem.offsetHeight;
					event.preventDefault();
				}
			};
			var scrollListener = function() {
				if (self.wrapperElem.offsetHeight + self.wrapperElem.scrollTop >= self.wrapperElem.scrollHeight) {
					console.log('test');
					self.trigger('click:load');
				}
			};
			var sendElemClickListener = function(event) {
				self.trigger('click:send');
			};

			this.wrapperElem.addEventListener('DOMMouseScroll', wheelListener, false);
			this.wrapperElem.addEventListener('mousewheel', wheelListener, false);
			this.wrapperElem.addEventListener('scroll', scrollListener);
			this.sendElem.addEventListener('click', sendElemClickListener);
			
			this.once('dispose', function() {
				self.wrapperElem.removeEventListener('DOMMouseScroll', wheelListener);
				self.wrapperElem.removeEventListener('mousewheel', wheelListener);
				self.wrapperElem.addEventListener('scroll', scrollListener);
				self.sendElem.removeEventListener('click', sendElemClickListener);
			});
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
			//this.loadElem.textContent = 'Загрузить еще друзей...';
			
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
//			var loadElemClickListener = function(event) {
//				analytics.send('friends', 'friends_load_more');
//			};
			
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
			this.wrapperElem.scrollTop = 0;
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
		FriendSearchView.prototype.selectFriend = function(user) {
			var userView = this._getOrCreateUserView(user);
			userView.select();
		};
		FriendSearchView.prototype.show = function() {
			base.prototype.show.apply(this, arguments);
			if (this.selectedUserView) {
				this.trigger({
					type: 'select:user',
					user: this.selectedUserView.model
				});
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
//			var loadElemClickListener = function(event) {
//				analytics.send('friends', 'groups_load_more');
//			};
			
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
			this.wrapperElem.scrollTop = 0;
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
		GroupSearchView.prototype.selectGroup = function(group) {
			var groupView = this._getOrCreateGroupView(group);
			groupView.select();
		};
		GroupSearchView.prototype.show = function() {
			base.prototype.show.apply(this, arguments);
			if (this.selectedGroupView) {
				this.trigger({
					type: 'select:group',
					group: this.selectedGroupView.model
				});
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

	var DialogPostPageView = (function(base) {
		eve.extend(DialogPostPageView, base);

		function DialogPostPageView() {
			base.apply(this, arguments);
			var self = this;

			this.elem = eye.template({
				templateId: 'dialog-post-page-template',
				id: 'dialog-post-page'
			});
			this.contactHolderElem = this.elem.getElementsByClassName('contact-holder')[0];
			this.sendElem = this.elem.getElementsByClassName('send')[0];
			this.teaserElem = this.elem.getElementsByClassName('teaser')[0];
			this.containerElem = this.elem.getElementsByClassName('container')[0];

			this.userView = new UserView(null, true);
			this.userView.attachFirstTo(this.contactHolderElem);
			this.userView.select();

			this.sendElem.addEventListener('click', function(event) {
				self.teaserElem.classList.add('hidden');
				self.containerElem.classList.remove('shifted');
				self.trigger({
					type: 'click:send',
					user: self.userView.model
				});
			});
		}

		DialogPostPageView.prototype.setContact = function(contact) {
			var self = this;
			this.userView.setModel(contact);
			contact.isAppUserAsync().then(function(isAppUser) {
				if (isAppUser) {
					self.teaserElem.classList.add('hidden');
					self.containerElem.classList.remove('shifted');
				} else {
					self.teaserElem.classList.remove('hidden');
					self.containerElem.classList.add('shifted');
				}
			}).catch(function() {
				self.teaserElem.classList.add('hidden');
				self.containerElem.classList.remove('shifted')
			});
		};

		return DialogPostPageView;
	})(PageView);
	
	messenger.views.PostPageView = PostPageView;
	messenger.views.LobbyView = LobbyView;
	messenger.views.DialogPostPageView = DialogPostPageView;
	
})(messenger, eve, abyss, template, analytics);