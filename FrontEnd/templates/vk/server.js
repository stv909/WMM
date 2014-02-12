// var http = require('http');
// var https = require('https');
// var FormData = require('form-data');

// var options = {
// 	hostname: 'oauth.vk.com',
// 	port: '80',
// 	path: '/authorize?client_id=4182796&redirect_uri=https://oauth.vk.com/blank.html&display=wap&response_type=token',
// 	method: 'POST',
// 	form: {
// 		email: '+79688390486',
// 		pass: '123qwe'
// 	}
// };

// var request = http.request(options);
// request.on('response', function(response) {
// 	console.log(response.statusCode);	
// });

var request = require("request");

request({
	uri: 'https://oauth.vk.com/authorize?client_id=4182796&redirect_uri=https://oauth.vk.com/blank.html&display=wap&response_type=token',
	method: "POST",
	form: {
		email: '+79688390486',
		pass: '123qwe'
	}
}, function(error, response, body) {
	console.log(body);
});



// http.request({
// 	method: 'POST',
// 	host: 'https://oauth.vk.com',
// 	headers: formData.getHeaders()
// });
// console.log(formData.getHeaders());

// http.createServer(function(request, response) {
// 	response.writeHead(200, { 'Content-Type': 'text/plain' });
// 	response.end('Hello');
// }).listen(process.env.PORT, process.env.IP);