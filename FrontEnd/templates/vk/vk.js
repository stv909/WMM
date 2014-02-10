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
		VK.Auth.login(loginCallback);
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
				var friendView = new FriendView(user);
				self.friendViews.push(friendView);
				friendView.attachTo(self.friendListElem);
			});
		});
		this.friendViews.forEach(function(view) {
			view.on('click', function(event) {
				self.trigger({
					type: 'click:user',
					user: event.user
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
		this.wallElem = document.getElementById('wall');
		this.wallContainerElem = this.wallElem.getElementsByClassName('main-container')[0];

		this.accountView = new AccountView();
		this.toolsView = new ToolsView();
		this.chooseWallView = new ChooseWallView();
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

		this.toolsView.attachTo(this.wallContainerElem);
		this.toolsView.on('click:create-message', function() {
		});
		this.toolsView.on('click:choose-wall', function() {
			var friends = self.storage.get('friends');
			var session = self.storage.get('session');
			var user = session.user;
			console.log(friends);
			self.chooseWallView.show(user, self.storage.get('friends'));
		});
		this.toolsView.hide();

		this.chooseWallView.attachTo(document.body);
		this.chooseWallView.on('click:user', function(event) {
			alert(JSON.stringify(event.user, null, 4));
		});
		this.chooseWallView.hide();
	};
	Application.prototype.initializeStorage = function() {
		var self = this;
		this.storage.on('change:session', function(event) {
			var session = event.value;
			var user = session.user;
			var firstName = user.first_name;
			var lastName = user.last_name;
			self.accountView.setLoginName([firstName, lastName].join(' '));
			self.toolsView.show();
			self.wallElem.classList.remove('hidden');
			self.prepareFriends();
		});
		this.storage.on('remove:session', function(event) {
			self.accountView.unsetLoginName();
			self.toolsView.hide();
			self.wallElem.classList.add('hidden');
			self.removeFriends();
		});
	};
	Application.prototype.prepareFriends = function() {
		var session = this.storage.get('session');
		var params = {
			user_id: 1,// session.user.id,
			fields: 'domain',
			v: 5.8
		};
		var friendsPromise = this.vkontakteClient.executeRequestAsync('friends.get', params);
		this.storage.set('friends', friendsPromise);
	};
	Application.prototype.removeFriends = function() {
		this.storage.unset('friends');
	};

	var application = new Application();
	application.initialize();
};