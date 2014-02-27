(function(async) {
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