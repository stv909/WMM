window.onload = function() {
	console.log('onload complete');

	var EventEmitter = eve.EventEmitter;
	var Model = abyss.Model;

	var defer = function() {
		var result = {};
		result.promise = new Promise(function(resolve, reject) {
			result.resolve = function(value) {
				resolve(value);
			};
			result.reject = function(value) {
				reject(value);
			};
			return result;
		});
		return result;
	};

	var VkontakteClient = function(appId) {
		this.appId = appId;
	}
	VkontakteClient.prototype.initialize = function() {
		VK.init({
			apiId: this.appId
		});
	};
	VkontakteClient.prototype.loginAsync = function() {
		var deferred = defer();
		var loginCallback = function(response) {
			if (response.session) {
				deferred.resolve(response);
			} else {
				deferred.reject(response);
			}
		};
		VK.Auth.login(loginCallback, VK.access.FRIENDS | VK.access.WALL);
		return deferred.promise;
	};
	VkontakteClient.prototype.logoutAsync = function() {
		var deferred = defer();
		var logoutCallback = function(response) {
			deferred.resolve(response);
		}
		VK.Auth.logout(logoutCallback);
		return deferred.promise;
	};
	VkontakteClient.prototype.executeRequestAsync = function(name, params) {
		var deferred = defer();
		var callback = function(value) {
			if (value.response) {
				deferred.resolve(value.response);
			} else {
				deferred.reject(value);
			}
		};
		VK.Api.call(name, params, callback);
		return deferred.promise;
	};

	var View = function() {
		View.super.apply(this);
		this.elem = null;
		this.parentElem = null;
	};
	View.super = EventEmitter;
	View.prototype = Object.create(EventEmitter.prototype);
	View.prototype.constructor = View;
	View.prototype.attachTo = function(parentElem) {
		if (!this.parentElem) {
			this.parentElem = parentElem;
			this.parentElem.appendChild(this.elem);
		}
	};
	View.prototype.detach = function() {
		if (this.parentElem) {
			this.parentElem.removeChild(this.elem);
			this.parentElem = null;
		}
	};
	View.prototype.dispose = function() {
		this.trigger('dispose');
		this.detach();
		this.off();
	};
	View.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	View.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};

	var AccountView = function() {
		AccountView.super.apply(this);
		var self = this;

		this.elem = template.create('account-template', { className: 'account' });
		this.loginElem = this.elem.getElementsByClassName('login')[0];
		this.logoutElem = this.elem.getElementsByClassName('logout')[0];
		this.nameElem = this.elem.getElementsByClassName('name')[0];

		var loginElemClickListener = function() {
			self.trigger({
				type: 'click:login'
			});
		};
		var logoutElemClickListener = function() {
			self.trigger({
				type: 'click:logout'
			});
		};

		this.loginElem.addEventListener('click', loginElemClickListener);
		this.logoutElem.addEventListener('click', logoutElemClickListener);

		this.once('dispose', function() {
			this.loginElem.removeEventListener('click', loginElemClickListener);
			this.logoutElem.removeEventListener('click', logoutElemClickListener);
		});
	};
	AccountView.super = View;
	AccountView.prototype = Object.create(View.prototype);
	AccountView.prototype.constructor = AccountView;
	AccountView.prototype.setLoginName = function(name) {
		this.nameElem.textContent = 'Welcome, ' + name;
		this.nameElem.classList.remove('hidden');
		this.loginElem.classList.add('hidden');
		this.logoutElem.classList.remove('hidden');
	};
	AccountView.prototype.unsetLoginName = function() {
		this.nameElem.textContent = '';
		this.nameElem.classList.add('hidden');
		this.loginElem.classList.remove('hidden');
		this.logoutElem.classList.add('hidden');
	};

	var ToolsView = function() {
		ToolsView.super.apply(this);
		var self = this;

		this.elem = template.create('tools-template', { id: 'tools' });
		this.createMessageElem = this.elem.getElementsByClassName('create-message')[0];
		this.chooseWallElem = this.elem.getElementsByClassName('choose-wall')[0];
		this.wallNameElem = this.elem.getElementsByClassName('wall-name')[0];

		var createMessageElemClickListener = function() {
			self.trigger({
				type: 'click:create-message'
			});
		};
		var chooseWallElemClickListener = function() {
			self.trigger({
				type: 'click:choose-wall'
			});
		};

		this.createMessageElem.addEventListener('click', createMessageElemClickListener);
		this.chooseWallElem.addEventListener('click', chooseWallElemClickListener);

		this.on('dispose', function() {
			self.createMessageElem.removeEventListener('click', createMessageElemClickListener);
			self.chooseWallElem.removeEventListener('click', chooseWallElemClickListener);
		});
	};
	ToolsView.super = View;
	ToolsView.prototype = Object.create(View.prototype);
	ToolsView.prototype.constructor = ToolsView;
	ToolsView.prototype.setWallName = function(name) {
		this.wallNameElem.textContent = name;	
	};
 
	var ChooseWallView = function() {
		ChooseWallView.super.apply(this);
		var self = this;

		this.elem = template.create('choose-wall-template', { className: 'dialog-background' } );
		this.dialogWindowElem = this.elem.getElementsByClassName('dialog-window')[0];
		this.friendListElem = this.elem.getElementsByClassName('friend-list')[0];
		this.friendViews = [];
		this.opened = false;

		this.documentKeyupListener = function(event) {
			if (event.keyCode === 27 && self.opened) {
				self.hide();
			}
		};

		var elemClickListener = function(event) {
			self.hide();
		};
		var dialogWindowElemClickListener = function(event) {
			event.stopPropagation();
		};

		this.elem.addEventListener('click', elemClickListener);
		this.dialogWindowElem.addEventListener('click', dialogWindowElemClickListener);

		this.on('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
			self.dialogWindowElem.removeEventListener('click', dialogWindowElemClickListener);
		});
	};
	ChooseWallView.super = View;
	ChooseWallView.prototype = Object.create(View.prototype);
	ChooseWallView.prototype.constructor = View;
	ChooseWallView.prototype.show = function(me, friendsPromise) {
		ChooseWallView.super.prototype.show.apply(this);
		document.addEventListener('keyup', this.documentKeyupListener);
		this.opened = true;
		this.removeFriendViews();
		var self = this;
		var friendView = new FriendView(me);
		self.friendViews.push(friendView);
		friendsPromise.then(function(response) {
			var users = response.items;
			users.forEach(function(user) {
				var view = new FriendView(user);
				self.friendViews.push(view);
			});
			self.friendViews.forEach(function(view) {
				view.attachTo(self.friendListElem);
				view.on('click', function(event) {
					self.trigger({
						type: 'click:user',
						user: event.user
					});
					self.hide();
				});
			});
		});
	};
	ChooseWallView.prototype.hide = function() {
		ChooseWallView.super.prototype.hide.apply(this);
		document.removeEventListener('keyup', this.documentKeyupListener);
		this.opened = false;
	};
	ChooseWallView.prototype.removeFriendViews = function() {
		this.friendViews.forEach(function(view) {
			view.dispose();
		});
		this.friendViews = [];
	};

	var FriendView = function(friend) {
		FriendView.super.apply(this);
		var self = this;

		this.elem = template.create('friend-template', { className: 'friend' });
		this.nameElem = this.elem.getElementsByClassName('name')[0];

		var firstName = friend.first_name;
		var lastName = friend.last_name;

		this.nameElem.textContent = [firstName, lastName].join(' ');

		var elemClickListener = function() {
			self.trigger({
				type: 'click',
				user: friend
			});
		};

		this.elem.addEventListener('click', elemClickListener);

		this.once('dispose', function() {
			this.elem.removeEventListener('click', elemClickListener);
		});
	};
	FriendView.super = View;
	FriendView.prototype = Object.create(View.prototype);
	FriendView.prototype.constructor = View;

	var WallView = function() {
		WallView.super.apply(this);
		var self = this;

		this.elem = template.create('wall-template', { id: 'wall' });
		
		this.wallItemViews = [];
	};
	WallView.super = View;
	WallView.prototype = Object.create(View.prototype);
	WallView.prototype.constructor = View;
	WallView.prototype.addWallItemView = function(wallItemView) {
		this.wallItemViews.push(wallItemView);
		wallItemView.attachTo(this.elem);
	};
	WallView.prototype.clearWallItemViews = function() {
		this.wallItemViews.forEach(function(view) {
			view.dispose();	
		});
		this.wallItemViews = [];
	};
	
	var WallItemView = function(item) {
		WallItemView.super.apply(this);
		var self = this;
		console.log(item);
		
		this.elem = template.create('wall-item-template', { className: 'wall-item' });
		this.contentHolder = this.elem.getElementsByClassName('content-holder')[0];
		this.textElem = this.elem.getElementsByClassName('text')[0];
		this.dateElem = this.elem.getElementsByClassName('date')[0];
		
		var date = new Date(item.date);
		var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
		var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
		var copyHistory = item.copy_history || [];
		var attachments = item.attachments || [];
		
		if (item.text === '') {
			this.textElem.classList.add('hidden');
		} else {
			this.textElem.textContent = item.text;
		}
		this.dateElem.textContent = [hours, minutes].join(':');
		
		copyHistory.forEach(function(history) {
			var p = document.createElement('p');
			var text = history.text;
			p.textContent = text;
			self.contentHolder.appendChild(p);
			
			var attachments = history.attachments || [];
			attachments.forEach(function(attachment) {
				if (attachment.type === 'photo') {
					var url = attachment.photo.photo_130;
					if (url) {
						var img = document.createElement('img');
						img.src = url;
						self.contentHolder.appendChild(img);
					}
				} else if (attachment.type === 'link') {
					var title = attachment.link.title;
					var url = attachment.link.url;
					var image = attachment.link.image_src;
					
					var link = document.createElement('a');
					link.href = url;
					link.textContent = title;
					
					if (image) {
						var br = document.createElement('br');
						var img = document.createElement('img');
						img.src = image;
						link.appendChild(br);
						link.appendChild(img);
					}
					self.contentHolder.appendChild(link);
				} else if (attachment.type === 'audio') {
					var title = attachment.audio.title;
					var url = attachment.audio.url;
					var link = document.createElement('a');
					link.href = url;
					link.textContent = title;
					self.contentHolder.appendChild(link);
				}
			});
		});
		
		attachments.forEach(function(attachment) {
			if (attachment.type === 'photo') {
				var url = attachment.photo.photo_130;
				if (url) {
					var img = document.createElement('img');
						img.src = url;
						self.contentHolder.appendChild(img);
					}
			} else if (attachment.type === 'link') {
				var title = attachment.link.title;
				var url = attachment.link.url;
				var image = attachment.link.image_src;
					
				var link = document.createElement('a');
				link.href = url;
				link.textContent = title;
					
				if (image) {
					var br = document.createElement('br');
					var img = document.createElement('img');
					img.src = image;
					link.appendChild(br);
					link.appendChild(img);
				}	
				self.contentHolder.appendChild(link);
			} else if (attachment.type === 'audio') {
				var title = attachment.audio.title;
				var url = attachment.audio.url;
				var link = document.createElement('a');
				link.href = url;
				link.textContent = title;
				self.contentHolder.appendChild(link);
			}
		});
	};
	WallItemView.super = View;
	WallItemView.prototype = Object.create(View.prototype);
	WallItemView.prototype.constructor = View;
	
	var GalaryView = function() {
		GalaryView.super.apply(this);
		var self = this;
		
		this.elem = template.create('galary-template', { id: 'galary' });
		this.sendButtonElem = this.elem.getElementsByClassName('send-button')[0];
		
		var sendButtonElemClickListener = function(event) {
			self.trigger({
				type: 'click:send',
				content: {
					message: 'test',
					attachments: []
				}
			});
		};
		
		this.sendButtonElem.addEventListener('click', sendButtonElemClickListener);
		
		this.once('dispose', function() {
			self.sendButtonElem.removeEventListener('click', sendButtonElemClickListener);	
		});
	};
	GalaryView.super = View;
	GalaryView.prototype = Object.create(View.prototype);
	GalaryView.prototype.constructor = View;
	
	var Storage = function() {
		Storage.super.apply(this);
	};
	Storage.super = Model;
	Storage.prototype = Object.create(Model.prototype);
	Storage.prototype.constructor = Storage;

	var Application = function() {
		this.appId = 4170375;
		this.vkontakteClient = new VkontakteClient(this.appId);
		this.storage = new Storage();

		this.pageElem = document.getElementById('page');
		this.menuElem = document.getElementById('menu');
		this.menuContainerElem = this.menuElem.getElementsByClassName('main-container')[0];
		this.wallHolderElem = document.getElementById('wall-holder');
		this.wallContainerElem = this.wallHolderElem.getElementsByClassName('main-container')[0];

		this.accountView = new AccountView();
		this.toolsView = new ToolsView();
		this.chooseWallView = new ChooseWallView();
		this.wallView = new WallView();
		this.galaryView = new GalaryView();
	};
	Application.prototype.initialize = function() {
		this.vkontakteClient.initialize();
		this.initializeViews();
		this.initializeStorage();
	};
	Application.prototype.initializeViews = function() {
		var self = this;

		this.accountView.attachTo(this.menuContainerElem);
		this.accountView.on('click:login', function() {
			self.vkontakteClient.loginAsync().then(function(response) {
				self.storage.set('session', response.session);
			}, function(error) {
				console.log(error);
			});
		});
		this.accountView.on('click:logout', function() {
			self.vkontakteClient.logoutAsync().then(function() {
				self.storage.unset('session');
			});
		});
		
		this.galaryView.attachTo(this.wallHolderElem);
		this.galaryView.hide();
		this.galaryView.on('click:send', function(event) {
			var content = event.content;
			var userId = self.storage.get('userId');
			var params = {
				owner_id: userId,
				message: content.message,
				attachments: content.attachments
			};
			var promise = self.vkontakteClient.executeRequestAsync('wall.post', params);
			promise.then(function(response) {
				self.prepareWall(userId);
			}, function(error) {
				console.log(error);
			});
		});
		this.wallHolderElem.removeChild(this.wallContainerElem);
		this.wallHolderElem.appendChild(this.wallContainerElem);

		this.toolsView.attachTo(this.wallContainerElem);
		this.toolsView.on('click:create-message', function() {
		});
		this.toolsView.on('click:choose-wall', function() {
			var friends = self.storage.get('friends');
			var session = self.storage.get('session');
			var user = session.user;
			self.chooseWallView.show(user, self.storage.get('friends'));
		});
		this.toolsView.hide();

		this.chooseWallView.attachTo(document.body);
		this.chooseWallView.on('click:user', function(event) {
			var user = event.user;
			self.prepareWall(user.id);
			self.storage.set('userId', user.id);
			var firstName = user.first_name;
			var lastName = user.last_name;
			self.toolsView.setWallName([firstName, lastName].join(' '));
		});
		this.chooseWallView.hide();
		
		this.wallView.attachTo(this.wallContainerElem);
		this.wallView.hide();
	};
	Application.prototype.initializeStorage = function() {
		var self = this;
		this.storage.on('change:session', function(event) {
			console.log(event);
			var session = event.value;
			var user = session.user;
			var id = user.id;
			var firstName = user.first_name;
			var lastName = user.last_name;
			self.storage.set('userId', id);
			self.accountView.setLoginName([firstName, lastName].join(' '));
			self.toolsView.setWallName([firstName, lastName].join(' '));
			self.toolsView.show();
			self.galaryView.show();
			self.wallHolderElem.classList.remove('hidden');
			self.prepareFriends();
			self.prepareWall(id);
		});
		this.storage.on('remove:session', function(event) {
			self.accountView.unsetLoginName();
			self.toolsView.hide();
			self.galaryView.hide();
			self.wallHolderElem.classList.add('hidden');
			self.removeFriends();
			self.removeWall();
		});
		this.storage.on('change:wall', function(event) {
			var wallPromise = event.value;
			wallPromise.then(function(response) {
				var items = response.items;
				self.wallView.clearWallItemViews();
				self.wallView.show();
				items.forEach(function(item) {
					if (!item.geo) {
						var wallItemView = new WallItemView(item);
						self.wallView.addWallItemView(wallItemView);
					}
				});
			}, function(error) {
				console.log(error);
			});
		});
		this.storage.on('remove:wall', function(event) {
			self.wallView.hide();
		});
	};
	Application.prototype.prepareFriends = function() {
		var session = this.storage.get('session');
		var params = {
			user_id: 1,//session.user.id,
			fields: 'domain',
			v: 5.8
		};
		var friendsPromise = this.vkontakteClient.executeRequestAsync('friends.get', params);
		this.storage.set('friends', friendsPromise);
	};
	Application.prototype.removeFriends = function() {
		this.storage.unset('friends');
	};
	Application.prototype.prepareWall = function(userId) {
		var params = {
			owner_id: userId,
			count: 100,
			filter: 'all',
			v: 5.8
		};
		var wallPromise = this.vkontakteClient.executeRequestAsync('wall.get', params);
		this.storage.set('wall', wallPromise);
	};
	Application.prototype.removeWall = function() {
		this.storage.unset('wall');
	};

	var application = new Application();
	application.initialize();
};