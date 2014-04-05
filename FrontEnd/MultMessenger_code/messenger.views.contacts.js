var messenger = messenger || {};

(function(messenger, eve, abyss, template, settings, analytics) {
	
	var ContactView = (function(base) {
		eve.extend(ContactView, base);
		
		function ContactView(forceSelecting) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('contact-template', { className: 'contact' });
			this.photoElem = this.elem.getElementsByClassName('photo')[0];
			this.nameElem = this.elem.getElementsByClassName('name')[0];
			this.unreadElem = this.elem.getElementsByClassName('unread')[0];
			
			this.selected = false;
			
			var elemClick = function(event) {
				if (forceSelecting) {
					self.select();
				}
				else if (!self.selected) {
					self.select();
				}
			};

			this.elem.addEventListener('click', elemClick);

			this.once('dispose', function() {
				self.elem.removeEventListener('click', elemClick);
			});
		}
		
		ContactView.prototype.select = function() {
			this.selected = true;
			this.elem.classList.remove('normal');
			this.elem.classList.add('chosen');
			this.trigger('select');
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
			
			var nameElemClickListener = function(event) {
				var id = self.model.get('id');
				var vkLink = [settings.vkContactBaseUrl, id].join('');
				window.open(vkLink, '_blank');
			};
			var elemClickListener = function(event) {
				analytics.send('friends', 'friends_select');	
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
						self.unreadElem.textContent = unread;
						self.unreadElem.classList.remove('hidden');
					} else {
						self.unreadElem.classList.add('hidden');
					}
				};
				var updateOnlineStatus = function(online) {
					if (online) {
						self.elem.classList.remove('closed');
					} else {
						self.elem.classList.add('closed');
					}
				};
				this.model.on('change:unread', function(event) {
					var unread = event.value;
					updateUnreadElem(unread);
				});
				this.model.on('change:online', function(event) {
					var online = event.online;
					updateOnlineStatus(online);
				});
				updateUnreadElem(this.model.get('unread'));
				updateOnlineStatus(this.model.get('online'));
			} else {
				if (this.model.get('canPost')) {
					this.elem.classList.remove('closed');
				} else {
					this.elem.classList.add('closed');
				}
			}
			
			this.photoElem.src = this.model.get('photo');
			this.nameElem.textContent = this.model.getFullName();
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