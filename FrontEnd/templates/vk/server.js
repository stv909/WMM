var request = require('request').defaults({ jar: true });
var dom = require('xmldom').DOMParser;
var xpath = require('xpath');
var url = require('url');
var q = require('q');

var vkApiUrl = 'https://api.vk.com/method/';
var vkPhotoUrl = '187534600';
var vkGetUploadServer = 'photos.getUploadServer?';

var requestAsync = q.denodeify(request);

var vkGetAuthTokenAsync = function() {
	
	var prepareLoginParams = function(data) {
		var doc = new dom().parseFromString(data);
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
	};
	
	var prepareAllowParams = function(data) {
		var doc = new dom().parseFromString(data);
		var uri = xpath.select('//*[@id="mcont"]/div/div[2]/form/@action', doc)[0].nodeValue;
		return {
			uri: uri
		};
	};
	
	var authUrl = [
		'https://oauth.vk.com/authorize?',
		'client_id=', 4170375, '&',
		'scope=', 'photos', '&',
		'display=', 'wap', '&',
		'redirect_uri=', 'http://oauth.vk.com/blank.html', '&',
		'response_type=', 'token'
	].join('');
	var logoutUrl = [
		'https://oauth.vk.com/authorize?',
		'client_id=', 4170375
	].join('');
	
	return requestAsync({
		uri: logoutUrl,
		method: 'GET'
	}).then(function(response) {
		return requestAsync({
			uri: authUrl,
			method: 'GET'
		});
	}).then(function(response) {
		console.log('start login');
		var body = response[1];
		var params = prepareLoginParams(body);
		console.log(params);
		return requestAsync({
			uri: params.uri,
			form: params.form,
			method: 'POST'
		});
	}).then(function(response) {
		console.log('get login form');
		var headers = response[0].headers;
		var location = headers.location;
		console.log(location);
		return requestAsync({
			uri: location,
			method: 'GET'
		});
	}).then(function(response) {
		console.log('get allow form');
		var body = response[1];
		console.log(response[0]);
		var params = prepareAllowParams(body);
		return requestAsync({
			uri: params.uri,
			method: 'POST'
		});
	}).then(function(response) {
		var headers = response[0].headers;
		var location = headers.location;
		var urlObj = url.parse(location, true);
		console.log(urlObj);
		return urlObj.hash;
	}); 
};

vkGetAuthTokenAsync().then(function(token) {
	var uri = [
		vkApiUrl,
		'photos.getAlbums?',
		'owner_id=', 233153157, '&',
		// vkGetUploadServer,
		// 'album_id=', vkPhotoUrl, '&',
		'v=5.9', '&'//,
		//'access_token=', token,
	].join('');
	console.log(uri);
	return requestAsync({
		uri: uri,
		method: 'GET'
	});
}).then(function(response) {
	console.log(response[1]);
});