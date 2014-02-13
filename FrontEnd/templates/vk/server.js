var request = require('request');
var xmldom = require('xmldom');
var xpath = require('xpath');
var url = require('url');
var q = require('q');

var requestAsync = q.denodeify(request.defaults({ jar: true }));

var vk = {
	_getChromeUserAgentString: function() {
		return 'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.107 Safari/537.36';
	},
	_prepareVkAuthLink: function() {
		return [
			'https://oauth.vk.com/authorize?',
			'client_id=', 4170375, '&',
			'scope=', 'photos', '&',
			'display=', 'wap', '&',
			'redirect_uri=', 'http://oauth.vk.com/blank.html', '&',
			'response_type=', 'token'
		].join('');
	},
	_prepareLoginParams: function(data) {
		var domParser = new xmldom.DOMParser({ 
			errorHandler: {
				warning: function() {},
			}
		});
		var doc = domParser.parseFromString(data);
		var uri = xpath.select('//*[@id="mcont"]/div/div[2]/form/@action', doc)[0].nodeValue;
		var form = {};
		form._origin = xpath.select('//*[@id="mcont"]/div/div[2]/form/input[1]/@value', doc)[0].nodeValue;
		form._ip_h = xpath.select('//*[@id="mcont"]/div/div[2]/form/input[2]/@value', doc)[0].nodeValue;
		form.to = xpath.select('//*[@id="mcont"]/div/div[2]/form/input[3]/@value', doc)[0].nodeValue;
		form.email = '+79688390486';
		form.pass = '123qwe';
		return {
			uri: uri,
			form: form
		};
	},
	_prepareUnusualParams: function(data) {
		var domParser = new xmldom.DOMParser({ 
			errorHandler: {
				warning: function() {}
			}
		});
		var doc = domParser.parseFromString(data);
		var uri = xpath.select('//*[@id="mcont"]/div/div/form/@action', doc)[0].nodeValue;
		var form = {
			code: 96883904,
		};
		return {
			uri: 'https://m.vk.com' + uri,
			form: form
		};
	},
	authAsync: function() {
		var uri	= vk._prepareVkAuthLink();
		return requestAsync({
			uri: uri,
			method: 'GET',
			headers: {
				'User-Agent': vk._getChromeUserAgentString()
			}
		});
	},
	loginAsync: function(loginHtmlPage) {
		var params = vk._prepareLoginParams(loginHtmlPage);
		return requestAsync({
			uri: params.uri,
			method: 'POST',
			form: params.form,
			headers: {
				'User-Agent': vk._getChromeUserAgentString()
			}
		});
	},
	redirectAsync: function(uri) {
		return requestAsync({
			uri: uri,
			method: 'GET',
			headers: {
				'User-Agent': vk._getChromeUserAgentString()
			}
		});
	},
	methodAsync: function(methodName, params, methodType, token) {
		var urlChunks = [
			'https://api.vk.com/method/',
			methodName, '?',
		];
		Object.keys(params).forEach(function(key) {
			urlChunks.push(key);
			urlChunks.push('='),
			urlChunks.push(params[key]);
			urlChunks.push('&');
		});
		if (token) {
			urlChunks.push('access_token');
			urlChunks.push('=');
			urlChunks.push(token);
		} else {
			urlChunks.pop();
		}
		var uri = urlChunks.join('');
		console.log('make request on: ' + uri);
		return requestAsync({
			uri: uri,
			methodType: methodType || 'GET',
			headers: {
				'User-Agent': vk._getChromeUserAgentString()
			}
		});
	},
	unusualAsync: function(unusualHtmlPage) {
		var params = vk._prepareUnusualParams(unusualHtmlPage);
		console.log('unusual params');
		console.log(params);
		return requestAsync({
			uri: params.uri,
			method: 'POST',
			form: params.form,
			headers: {
				'User-Agent': vk._getChromeUserAgentString()
			}
		});
	}
};

var currentToken = null;
vk.authAsync().spread(function(response, body) {
	console.log('prepare login form');
	return vk.loginAsync(body);
}).spread(function(response, body) {
	console.log('login form post complete');
	if (response.statusCode === 302) {
		var headers = response.headers;
		var tokenPageUri = headers.location;
		return vk.redirectAsync(tokenPageUri);
	} else {
		console.log(response.statusCode);
		throw new Error('vk changes login page');
	}
}).spread(function(response, body) {
	console.log('redirected token page');
	var request = response.request;
	var uri = request.href;
	var parsedUri = url.parse(uri, true);
	var hash = parsedUri.hash;
	var token = hash.split('&')[0].replace('#access_token=', '');
	return token;
}).then(function(token) {
	console.log('token extract complete');
	console.log(token);
	currentToken = token;
	return vk.methodAsync('photos.getAlbums', {
		owner_id: 233153157,
		album_id: 187534600,
		v: 5.9
	}, 'GET');
}).spread(function(response, body) {
	console.log(body);
	return vk.methodAsync('photos.getUploadServer', {
		album_id: 187534600,
		v: 5.9
	}, 'GET', currentToken);
}).spread(function(response, body) {
	console.log(body);
	var parsedData = JSON.parse(body);
	if (parsedData.error) {
		var error = parsedData.error;
		var redirectUri = error.redirect_uri;
		vk.redirectAsync(redirectUri).spread(function(response, body) {
			console.log('unusual validation');
			return vk.unusualAsync(body);
		}).spread(function(response, body) {
			console.log(body);
		});
	}
}).fail(function(error) {
	console.log(error);
});