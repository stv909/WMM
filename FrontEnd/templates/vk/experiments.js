var http = require('http');
var q = require('q');
var fs = require('fs');
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
			response.setEncoding('responseEncoding')
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
		console.log(error);
		deferred.reject(new Error(error.message));	
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

http.createServer(function(req, res) {
	if (req.method === 'POST') {
		var chunks = [];
		req.on('data', function(chunk) {
			chunks.push(chunk);
		});
		req.on('end', function() {
			var rawBody = chunks.join('');
			var body = JSON.parse(rawBody);
			var uri = body.uri;
			var file1 = body.file1;
			requestAsync(file1, null, null, 'binary').spread(function(response, body) {
				var fileSize = body.length;
				console.log(fileSize);
				var boundryBegin = multipart.getBoundryBegin('image', 'image.jpg', fileSize, 'image/jpeg');
				var boundryEnd = multipart.getBoundryEnd();
				var parsedUri = url.parse(uri);
				//console.log(parsedUri);
				var options = {
					hostname: parsedUri.hostname,
					path: parsedUri.path,
					method: 'POST',
					port: 80,
					headers: {
						'Content-Type': multipart.getContentType(),
						'Content-Length': multipart.getContentLength(boundryBegin, boundryEnd, fileSize),
						'User-Agent': multipart.getUserAgent()
					}
				};
				var data = [boundryBegin, body, '\r\n', boundryEnd].join('');
				console.log('upload');
				console.log(options);
				return requestAsync(options, data, 'binary');
			}).spread(function(response, body) {
				console.log('uploaded');
				console.log(body);
				res.writeHead(200, {
					'Content-Type': 'plain/text',
					'Access-Control-Allow-Origin': '*'
				});
				res.end(body);
			}).fail(function(error) {
				console.log(error);
				res.writeHead(200, {
					'Content-Type': 'plain/text',
					'Access-Control-Allow-Origin': '*'
				});
				res.end('fail');
			});
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'plain/text',
			'Access-Control-Allow-Origin': '*'
		});
		res.end('ok');
	}
}).listen(process.env.PORT, process.env.IP);