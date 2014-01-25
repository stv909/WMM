window.onload = function() {

	var socket = new WebSocket('ws://wmm-c9-stv909.c9.io/');

	var responseHandlers = {};

	socket.addEventListener('open', function(event) {
		console.log('socket opened');
		authorize('box', '123').then(function(response) {
			console.log(response);
		});
		rejectRequestHandler('authorize');
		authorize('fox', '321').then(function(response) {
			console.log(response);
		});
	});

	socket.addEventListener('close', function(event) {
		console.log('socket closed');
	});

	socket.addEventListener('message', function(event) {
		var response = JSON.parse(event.data);
		var responseHandler = responseHandlers[response.tag][response.transactionId];
		var responseCallback = responseHandler.callback;
		var rejected = responseHandler.rejected;
		responseCallback(response, rejected);
	});

	var registerRequestHandler = function(tag, transactionId, responseDeferred) {
		var responseCallback = function(response, rejected) {
			delete responseHandlers[tag][transactionId];
			if (rejected) {
				responseDeferred.reject(new Error('Promise rejected'));
			} else {
				responseDeferred.resolve(response);
			}
		};
		responseHandlers[tag] = responseHandlers[tag] || {};
		responseHandlers[tag][transactionId] = {
			callback: responseCallback,
			rejected: false
		};
	};

	var rejectRequestHandler = function(tag, transactionId) {
		if (tag) {
			var taggedResponseHandlers = responseHandlers[tag];
			if (!taggedResponseHandlers) {
				throw new Error('Not found request handlers');
			}
			if (transactionId) {
				taggedResponseHandlers[transactionId].rejected = true;
			} else {
				var transactionIds = Object.keys(taggedResponseHandlers);
				transactionIds.forEach(function(currentTransactionId) {
					taggedResponseHandlers[currentTransactionId].rejected = true;
				});
			}
		} else {
			var tags = Object.keys(responseHandlers);
			tags.forEach(function(currentTag) {
				rejectRequestHandler(currentTag);
			});
		}
	};

	var authorize = function(user, password) {
		var transactionId = uuid.v4();
		var tag = 'authorize';
		var authorizeRequest = {
			tag: tag,
			transactionId: transactionId,
			authorize: {
				login: user,
				password: password
			}
		};
		var authorizeResponseDeferred = Q.defer();
		var authorizeResponsePromise = authorizeResponseDeferred.promise;

		registerRequestHandler(tag, transactionId, authorizeResponseDeferred);
		socket.send(JSON.stringify(authorizeRequest, null, 4));

		return authorizeResponsePromise;
	};
};