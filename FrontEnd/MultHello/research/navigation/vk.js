(function(async) {
	VK.apiAsync = function(method, params) {
		var deferred = async.defer();
		
		VK.api(method, params, function(data) {
			if (data.response) {
				deferred.resolve(data.response);
			} else {
				deferred.reject(new Error(JSON.stringify(data.error, null, 4)));
			}
		});
		
		return deferred.promise;
	}
	VK.initAsync = function() {
		var deferred = async.defer();
		
		VK.init(function() {
			deferred.resolve('complete');	
		}, function() {
			deferred.reject('vk init fail');
		}, 5.12);
		
		return deferred.promise;
	};
})(async);