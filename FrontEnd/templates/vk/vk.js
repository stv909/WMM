window.onload = function() {
	console.log('onload complete');

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
	};

	var VkontakteClient = function(appId) {
		this.appId = appId;
	}
	VkontakteClient.prototype.initializeAsync = function() {
		VK.init({
			appId: this.appId
		});
		return Promise.resolve(true);
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
		var callback = function(response) {
			deferred.resolve(response);
		};
		VK.Api.call(name, params, callback);
		return deferred.promise;
	};

	var appId = 4170375;
	var vkontakteClient = new VkontakteClient(appId);

	vkontakteClient.initializeAsync().then(function() {
		return vkontakteClient.loginAsync();
	}).then(function(response) {
		console.log(response);
	});
};