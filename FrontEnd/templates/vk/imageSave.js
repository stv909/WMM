var request = require('request');
var http = require('http');
var fs = require('fs');
var path = require('path');
var FormData = require('form-data');

http.createServer(function(req, res) {
	console.log('request accept');
	console.log(req.method);

	if (req.method === 'POST') {
		var body = '';
		req.on('data', function(data) {
			body += data;
		});
		req.on('end', function() {
			var params = JSON.parse(body);
			
			console.log(params.uri);
			console.log(params.file1);
			
			var innerRes = res;
			var form = new FormData();
			
			form.append('file1', request(params.file1));
			console.log(form);
			console.log(form.getHeaders());
			form.submit(params.uri, function(err, res) {
				res.on('data', function(chunk) {
					console.log('BODY: ' + chunk);
				});
				console.log(res.headers);
				innerRes.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
				innerRes.end('complete');
			});
		});
	} else {
		res.writeHead(200, { 'Access-Control-Allow-Origin': '*'});
		res.end('complete');
	}
}).listen(process.env.PORT, process.env.IP);
console.log('server started');