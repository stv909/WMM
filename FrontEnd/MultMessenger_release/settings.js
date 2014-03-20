var settings = settings || {};

(function(settings) {
	settings.version = 'release'; //can be: 'dev' | 'content' | 'release'
	
	settings.publicIds = {
		'dev': 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9',
		'content': 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9',
		'release': 'public.7d90d69d-a990-483a-8567-ce51ea81f7b7'
	};
	settings.vkAppUrls = {
		'dev': 'vk.com/app4222414',
		'content': 'vk.com/app4214902',
		'release': 'vk.com/toome_app'
	};
	settings.chatUrls = {
		'dev': 'wss://www.bazelevscontent.net/9012/',
		'content': 'wss://www.bazelevscontent.net/9009/',
		'release': 'wss://www.bazelevscontent.net/9009/'
	};
	settings.previewGeneratorUrls = {
		'dev': 'https://www.bazelevscontent.net/8894',
		'content': 'https://www.bazelevscontent.net/8892',
		'release': 'https://www.bazelevscontent.net/8892'
	};
	settings.imageStoreBaseUrls = {
		'dev': 'https://www.bazelevscontent.net/8584/',
		'content': 'https://www.bazelevscontent.net/8582/',
		'release': 'https://www.bazelevscontent.net/8582/'
	};
	settings.layerImageStoreBaseUrls = {
		'dev': 'https://www.bazelevscontent.net/8584/',
		'content': 'https://www.bazelevscontent.net/8582/',
		'release': 'https://www.bazelevscontent.net/8582/'
	};
	settings.animationServiceUrls = {
		'dev': 'https://www.bazelevscontent.net/8794',
		'content': 'https://www.bazelevscontent.net/8792',
		'release': 'https://www.bazelevscontent.net/8792'
	};
	
	settings.publicId = settings.publicIds[settings.version];
	settings.vkAppUrl = settings.vkAppUrls[settings.version];
	settings.vkAppHttpUrl = ['http://', settings.vkAppUrl].join('');
	settings.vkAppHttpsUrl = ['https://', settings.vkAppUrl].join('');
	settings.shareMessageBaseUrl = 'https://bazelevscontent.net/multmessenger_release/share.html?ids=msg.';
	settings.characterListUrl = 'https://bazelevshosting.net/MCM/characters_resources.json';
	settings.chatUrl = settings.chatUrls[settings.version];
	settings.previewGeneratorUrl = settings.previewGeneratorUrls[settings.version];
	settings.imageStoreBaseUrl = settings.imageStoreBaseUrls[settings.version];
	settings.layerImageStoreBaseUrl = settings.layerImageStoreBaseUrls[settings.version];
	settings.animationServiceUrl = settings.animationServiceUrls[settings.version];
	settings.groupUrl = 'https://vk.com/toome_mobi';
})(settings);