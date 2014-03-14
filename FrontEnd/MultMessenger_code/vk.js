(function(Q, errors) {
	
	var ErrorCodes = errors.ErrorCodes;
	
	VK.apiAsync = function(method, params) {
		var deferred = Q.defer();
		
		VK.api(method, params, function(data) {
			if (data.response) {
				deferred.resolve(data.response);
			} else {
				deferred.reject({
					errorCode: ErrorCodes.API_ERROR,
					message: data.error
				});
			}
		});
		
		return deferred.promise;
	}
	VK.initAsync = function() {
		var deferred = Q.defer();
		
		VK.init(function() {
			deferred.resolve();
		}, function() {
			deferred.reject(new Error('Failed to init VK api'));
		}, 5.12);
		
		return deferred.promise;
	};
	
})(Q, errors);