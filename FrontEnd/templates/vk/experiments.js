var http = require('http');
var q = require('q');
var url = require('url');

var multipart = {
	boundry: 'WebKitFormBoundarym0vCJKBpUYdCIWQG',
	getBoundryBegin: function(name, fileName, fileSize, contentType) {
		return [
			'--', multipart.boundry, '\r\n',
			'Content-Disposition: form-data; ',
			'name="', name, '"; ',
			'filename="', fileName, '"\r\n',
			'Content-Length: ', fileSize, '\r\n',
			'Content-Type: ', contentType,
			'\r\n\r\n'
		].join('');
	},
	getBoundryEnd: function() {
		return [
			'--', multipart.boundry, '--', '\r\n'
		].join('');
	},
	getContentLength: function(boundryBegin, boundryEnd, fileSize) {
		return boundryBegin.length + fileSize + 2 + boundryEnd.length;
	},
	getContentType: function() {
		return [
			'multipart/form-data; boundary=', multipart.boundry
		].join('');
	},
	getUserAgent: function() {
		return 'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36';
	}
};

var requestAsync = function(options, data, requestEncoding, responseEncoding) {
	var deferred = q.defer();
	var request = http.request(options, function(response) {
		if (responseEncoding) {
			response.setEncoding(responseEncoding);
		}
		var chunks = [];
		response.on('data', function(chunk) {
			chunks.push(chunk);	
		});
		response.on('end', function() {
			deferred.resolve([response, chunks.join('') ]);
		});
	});
	request.on('error', function(error) {
		deferred.reject(error);	
	});
	if (data instanceof Array) {
		data.forEach(function(item) {
			request.write(item, requestEncoding);
		});
		request.end();
	} else {
		request.end(data, requestEncoding);	
	}
	return deferred.promise;
};

var readRequestBodyAsync = function(request) {
	var deferred = q.defer();
	var chunks = [];
	request.on('data', function(chunk) {
		chunks.push(chunk);
	});
	request.on('end', function() {
		deferred.resolve(chunks.join(''));
	});
	return deferred.promise;
};

http.createServer(function(req, res) {
	if (req.method === 'POST') {
		readRequestBodyAsync(req)
		.then(function(rawBody) {
			var body = JSON.parse(rawBody);
			var uploadUri = body.uri;
			var file1 = body.file1;
			return requestAsync(file1, null, null, 'binary')
			.spread(function(response, body) {
				return [uploadUri, response, body];	
			});
		}).spread(function(uploadUri, response, body) {
			var fileSize = body.length;
			var boundryBegin = multipart.getBoundryBegin('file1', 'image.jpg', fileSize, 'image/jpeg');
			var boundryEnd = multipart.getBoundryEnd();
			var parsedUri = url.parse(uploadUri);
			var options = {
				hostname: parsedUri.hostname,
				path: parsedUri.path,
				method: 'POST',
				port: 80,
				headers: {
					'Content-Type': multipart.getContentType(),
					'Content-Length': multipart.getContentLength(boundryBegin, boundryEnd, fileSize),
				}
			};
			var data = [boundryBegin, body, '\r\n', boundryEnd];
			return requestAsync(options, data, 'binary');
		}).spread(function(response, body) {
			res.writeHead(200, {
				'Content-Type': 'plain/text',
				'Access-Control-Allow-Origin': '*'
			});
			res.end(body);
		}).fail(function(error) {
			console.log(error);
			res.writeHead(500, {
				'Content-Type': 'plain/text',
				'Access-Control-Allow-Origin': '*'
			});
			res.end('fail');
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'plain/text',
			'Access-Control-Allow-Origin': '*'
		});
		res.end('ok');
	}
}).listen(process.env.PORT, process.env.IP);