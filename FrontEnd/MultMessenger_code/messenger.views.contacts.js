var messenger = messenger || {};

(function(messenger, eve, abyss, template, settings, analytics) {
	
	var ContactView = (function(base) {
		eve.extend(ContactView, base);
		
		function ContactView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('contact-template', { className: 'contact' });
			this.photoElem = this.elem.getElementsByClassName('photo')[0];
			this.nameElem = this.elem.getElementsByClassName('name')[0];
			this.unreadElem = this.elem.getElementsByClassName('unread')[0];
			this.statusElem = this.elem.getElementsByClassName('status')[0];

			this.selected = false;

			var elemClick = function(event) {
				self.trigger('select-force');
				if (!self.selected) {
					self.select();
				}
			};

			this.elem.addEventListener('click', elemClick);

			this.once('dispose', function() {
				self.elem.removeEventListener('click', elemClick);
			});
		}
		
		ContactView.prototype.select = function(options) {
			this.selected = true;
			this.elem.classList.remove('normal');
			this.elem.classList.add('chosen');
			this.trigger({
				type: 'select',
				options: options
			});
		};
		
		ContactView.prototype.deselect = function() {
			this.selected = false;
			this.elem.classList.add('normal');
			this.elem.classList.remove('chosen');
			this.trigger('deselect');
		};
		
		ContactView.prototype.setModel = function(model) {
			this.model = model;
		};
		
		ContactView.prototype.disableUnreadCounter = function() {
			this.unreadElem.classList.add('super-hidden');
		};
		
		ContactView.prototype.disableSelecting = function() {
			this.selected = true;
			this.elem.style.cursor = 'default';
		};
		
		ContactView.prototype.disablePhoto = function() {
			this.photoElem.classList.add('hidden');
		};
		
		return ContactView;
	})(abyss.View);
	
	var UserView = (function(base) {
		eve.extend(UserView, base);
		
		function UserView(model, isChatUser) {
			base.call(this, isChatUser);
			var self = this;
			
			this.isChatUser = isChatUser;
			this.setModel(model);
			this.deselect();
			this.analyticCallback = function() {
				analytics.send('friends', 'friends_select');
			};
			
			var nameElemClickListener = function(event) {
				var id = self.model.get('id');
				var vkLink = [settings.vkContactBaseUrl, id].join('');
				window.open(vkLink, '_blank');
			};
			var elemClickListener = function(event) {
				self.analyticCallback();
			};
			
			this.nameElem.addEventListener('click', nameElemClickListener);
			this.elem.addEventListener('click', elemClickListener);
						
			this.on('dispose', function() {
				self.nameElem.removeEventListener('click', nameElemClickListener);	
				self.elem.removeEventListener('click', elemClickListener);
			});
		}
		
		UserView.prototype.setModel = function(model) {
			base.prototype.setModel.apply(this, arguments);
			var self = this;

			if (!this.model) {
				return;
			}
			
			if (this.isChatUser) {
				var updateUnreadElem = function(unread) {
					if (unread > 0) {
						self.unreadElem.textContent = ['+', unread].join('');
						self.unreadElem.classList.remove('hidden');
					} else {
						self.unreadElem.classList.add('hidden');
					}
				};
				var updateOnlineStatus = function(online) {
					if (online) {
						self.statusElem.classList.remove('offline');
					} else {
						self.statusElem.classList.add('offline');
					}
				};
				var updateIsAppUser = function(isAppUser) {
					if (isAppUser) {
						self.elem.classList.add('app');
					} else {
						self.elem.classList.remove('app');
					}
				};
				this.model.on('set:unread', function(event) {
					var unread = event.value;
					updateUnreadElem(unread);
				});
				this.model.on('set:online', function(event) {
					var online = event.value;
					updateOnlineStatus(online);
				});
				this.model.on('set:isAppUser', function(event) {
					var isAppUser = event.value;
					updateIsAppUser(isAppUser);
				});
				updateUnreadElem(this.model.get('unread'));
				updateOnlineStatus(this.model.get('online'));
				updateIsAppUser(this.model.get('isAppUser'));
			}

			if (this.model.get('canPost')) {
				this.elem.classList.remove('closed');
			} else {
				this.elem.classList.add('closed');
			}
			
			this.photoElem.src = this.model.get('photo');
			this.nameElem.textContent = this.model.getFullName();
		};
		
		UserView.prototype.setAnalytic = function(analyticCallback) {
			this.analyticCallback = analyticCallback;
		};
		
		return UserView;
	})(ContactView);
	
	var GroupView =(function(base) {
		eve.extend(GroupView, base);
		
		function GroupView(model) {
			base.apply(this, arguments);
			var self = this;
			
			this.setModel(model);
			this.deselect();
			
			var nameElemClickListener = function(event) {
				var id = -self.model.get('id');
				var type = self.model.get('type');
				var vkLink = [settings.vkGroupBaseUrls[type], id].join('');
				window.open(vkLink, '_blank');
			};
			var elemClickListener = function(event) {
				analytics.send('friends', 'groups_select');	
			};
			
			this.nameElem.addEventListener('click', nameElemClickListener);
			this.elem.addEventListener('click', elemClickListener);

			this.on('dispose', function() {
				self.nameElem.removeEventListener('click', nameElemClickListener);
				self.elem.removeEventListener('click', elemClickListener);
			});
		}
		
		GroupView.prototype.setModel = function(model) {
			base.prototype.setModel.apply(this, arguments);

			if (!this.model) {
				return;
			}
			
			this.photoElem.src = this.model.get('photo');
			this.nameElem.textContent = this.model.get('name');
		};
		
		return GroupView;
	})(ContactView);
	
	messenger.views = messenger.views || {};
	messenger.views.UserView = UserView;
	messenger.views.GroupView = GroupView;
	
})(messenger, eve, abyss, template, settings, analytics);