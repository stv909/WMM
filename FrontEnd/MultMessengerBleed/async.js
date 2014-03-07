var async = async || {};

(function(async, Q) {

	var requestAsync = function(options) {
		var url = options.url;
		var method = options.method;
		var data = options.data;
		var headers = options.headers || [];
		var request = new XMLHttpRequest();
		var deferred = Q.defer();
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

	async.requestAsync = requestAsync;

})(async, Q);