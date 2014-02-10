window.onload = function() {
	console.log('onload complete');

	var EventEmitter = eve.EventEmitter;

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

	var AccountView = function() {
		AccountView.super.apply(this);
		var self = this;

		this.parentElem = null;
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
	AccountView.super = EventEmitter;
	AccountView.prototype = Object.create(EventEmitter.prototype);
	AccountView.prototype.constructor = AccountView;
	AccountView.prototype.attachTo = function(parentElem) {
		if (!this.parentElem) {
			this.parentElem = parentElem;
			this.parentElem.appendChild(this.elem);
		}
	};
	AccountView.prototype.detach = function() {
		if (this.parentElem) {
			this.parentElem.removeChild(this.elem);
			this.parentElem = null;
		}
	};
	AccountView.setLoginName = function(name) {
		this.nameElem.textContent = 'Welcome, ' + name;
		this.nameElem.classList.remove('hidden');
		this.loginElem.classList.add('hidden');
		this.logoutElem.classList.remove('hidden');
	};
	AccountView.unsetLoginName = function() {
		this.nameElem.textContent = '';
		this.nameElem.classList.add('hidden');
		this.loginElem.classList.remove('hidden');
		this.logoutElem.classList.add('hidden');
	};
	AccountView.prototype.dispose = function() {
		this.trigger('dispose');
		this.detach();
		this.off();
	};

	var Application = function() {
		this.appId = 4170375;
		this.vkontakteClient = new VkontakteClient(this.appId);

		this.menuElem = document.getElementById('menu');
		this.menuContainerElem = document.getElementsByClassName('main-container')[0];
		this.accountView = new AccountView();
	};
	Application.prototype.initialize = function() {
		var self = this;
		this.vkontakteClient.initialize();

		this.accountView.attachTo(this.menuContainerElem);
		this.accountView.on('click:login', function() {
			self.vkontakteClient.loginAsync().then(function(response) {
				var session = response.session.user;
				self.accountView.setLoginName('test');
			});
		});
		this.accountView.on('click:logout', function() {
			self.vkontakteClient.logoutAsync().then(function() {
				self.accountView.unsetLoginName();
			});
		});
	};

	var application = new Application();
	application.initialize();

//	vkontakteClient.initializeAsync().then(function() {
//		return vkontakteClient.loginAsync();
//	}).then(function(response) {
//		console.log(response);
//		var userId = response.session.user.id;
//		var friendsGetParams = { user_id: userId, v: 5.8 };
//		return vkontakteClient.executeRequestAsync('friends.get', friendsGetParams);
//	}).then(function(respose) {
//		console.log(respose);
//	}, function(error) {
//		console.log(error);
//	});
};