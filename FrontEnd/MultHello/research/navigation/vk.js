(function(async) {
	// VK.Auth.getLoginStatusAsync = function() {
	// 	var deferred = async.defer();
	// 	VK.Auth.getLoginStatus(function(response) {
	// 		if (response.session) {
	// 			deferred.resolve(response.session);
	// 		} else {
	// 			deferred.reject(new Error('user is not authorized'));
	// 		}
	// 	});
	// 	return deferred.promise;
	// };
	// VK.Auth.loginAsync = function(settings) {
	// 	var deferred = async.defer();
	// 	VK.Auth.login(function(response) {
	// 		if (response.session) {
	// 			deferred.resolve(response.session);
	// 		} else {
	// 			deferred.reject(new Error('user is not authorized'));
	// 		}
	// 	}, settings);
	// 	return deferred.promise;
	// };
	// VK.Api.callAsync = function(method, params) {
	// 	var deferred = async.defer();
	// 	VK.Api.call(method, params, deferred.resolve);
	// 	return deferred.promise;
	// };
	VK.apiAsync = function(method, params) {
		var deferred = async.defer();
		
		VK.api(method, params, function(data) {
			if (data.response) {
				deferred.resolve(data.response);
			} else {
				deferred.reject(new Error(data.error));
			}
		});
		
		return deferred.promise;
	}
})(async);