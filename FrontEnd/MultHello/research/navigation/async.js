var async = async || {};

(function(async) {

	var defer = function() {
		var result = {};
		result.promise = new Promise(function(resolve, reject) {
			result.resolve = resolve;
			result.reject = reject;
		});
		return result;
	};

	var requestAsync = function(options) {
		var url = options.url;
		var method = options.method;
		var data = options.data;
		var headers = options.headers || [];
		var request = new XMLHttpRequest();
		var deferred = defer();
		var promise = deferred.promise;

		promise.cancel = function() {
			request.abort();
		};

		request.open(method, url, true);
		headers.forEach(function(header) {
			request.setRequestHeader(header.key, header.value);
		});
		request.onload = function() {
			deferred.resolve(request.responseText);
		};
		request.abort = function() {
			deferred.reject(new Error('request aborted'));
		};
		request.onerror = function(error) {
			deferred.reject(new Error(error));
		};
		request.send(data);

		return promise;
	};

	async.defer = defer;
	async.requestAsync = requestAsync;

})(async);