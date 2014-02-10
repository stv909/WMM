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
	ChooseWallView.prototype.show = function() {
		ChooseWallView.super.prototype.show.apply(this);
		document.addEventListener('keyup', this.documentKeyupListener);
		this.opened = true;
	};
	ChooseWallView.prototype.hide = function() {
		ChooseWallView.super.prototype.hide.apply(this);
		document.removeEventListener('keyup', this.documentKeyupListener);
		this.opened = false;
	};
	
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
//			if (self.storage.has('friends')) {
//
//			} else {
//				var session = self.storage.get('session');
//				var params = {
//					user_id: session.user.id,
//					fields: 'domain',
//					v: 5.8
//				};
//				var promise = self.vkontakteClient.executeRequestAsync('friends.get', params);
//				promise.then(function(response) {
//					self.storage.set('friends', response.items)
//				});
//			}

		});
		this.toolsView.on('click:choose-wall', function() {
			self.chooseWallView.show();
		});
		//this.toolsView.hide();

		this.chooseWallView.attachTo(document.body);
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
		});
		this.storage.on('remove:session', function(event) {
			self.accountView.unsetLoginName();
			self.toolsView.hide();
			self.wallElem.classList.add('hidden');
		});
	};

	var application = new Application();
	application.initialize();
};