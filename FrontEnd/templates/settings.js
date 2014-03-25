var settings = settings || {};

(function(settings) {
	
	settings.version = window.location.search.indexOf('?version=dev') !== -1 ? 'dev' : 'release';
	console.log('version: ' + settings.version);
	
	settings.previewGeneratorUrls = {
		'dev': 'https://www.bazelevscontent.net:4443/8894/',
		'release': 'https://www.bazelevscontent.net/8892/'
	};

	settings.chatUrls = {
		'dev': 'wss://www.bazelevscontent.net:4443/9012/',
		'release': 'wss://www.bazelevscontent.net/9009/'
	};
	
	settings.previewGeneratorUrl = settings.previewGeneratorUrls[settings.version];
	settings.chatUrl = settings.chatUrls[settings.version];
	
	
})(settings);