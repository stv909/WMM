var http = require('http');
var https = require('https');
var q = require('q');
var url = require('url');
var path = require('path');

var imageMimes = {
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpg',
	'.png': 'image/png',
	'.gif': 'image/gif'
};

var getImageMime = function(extname) {
	extname = extname.toLowerCase();
	var mime = imageMimes[extname];
	if (mime) {
		return mime;
	} else {
		throw new Error('unknown image mime');
	}
};

var getImageInfo = function(imageUrl) {
	var fileName = path.basename(imageUrl);
	var extName = path.extname(fileName);
	var fileMime = getImageMime(extName);
	
	return {
		fileName: fileName,
		fileMime: fileMime
	};
};

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

var getRequestProtocol = function(options) {
	var currentUrl = (typeof options === 'string') ? options : options.hostname;
	var parsedUrl = url.parse(currentUrl);
	return parsedUrl.protocol === 'https' ? https : http;
};

var requestAsync = function(options, data, requestEncoding, responseEncoding) {
	var deferred = q.defer();
	var protocol = getRequestProtocol(options);
	var request = protocol.request(options, function(response) {
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
			var uploadUrl = body.uploadUrl;
			var file1 = body.file1;
			var imageInfo = getImageInfo(file1);
			var uploadInfo = {
				uploadUrl: uploadUrl,
				imageInfo: imageInfo
			};
			return requestAsync(file1, null, null, 'binary')
			.spread(function(response, body) {
				return [uploadInfo, response, body];	
			});
		}).spread(function(uploadInfo, response, body) {
			var uploadUrl = uploadInfo.uploadUrl;
			var imageInfo = uploadInfo.imageInfo;
			var fileSize = body.length;
			var boundryBegin = multipart.getBoundryBegin('file1', imageInfo.fileName, fileSize, imageInfo.fileMime);
			var boundryEnd = multipart.getBoundryEnd();
			var parsedUrl = url.parse(uploadUrl);
			var options = {
				hostname: parsedUrl.hostname,
				path: parsedUrl.path,
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