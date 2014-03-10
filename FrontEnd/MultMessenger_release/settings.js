var settings = settings || {};

(function(settings) {
	settings.shareMessageBaseUrl = 'https://bazelevscontent.net/multmessenger_release/share.html?ids=msg.';
	settings.releasePublicId = 'public.7d90d69d-a990-483a-8567-ce51ea81f7b7';
	settings.debugPublicId = 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9';
	settings.debug = false;
	settings.publicId = settings.debug ? settings.debugPublicId : settings.releasePublicId;
	settings.characterListUrl = 'https://bazelevshosting.net/MCM/characters_resources.json';
	settings.imageUploadServiceUrl = 'http://bazelevscontent.net:9090/';
	settings.vkAppUrl = 'vk.com/app4235060';
	settings.vkAppHttpUrl = ['http://', settings.vkAppUrl].join('');
	settings.vkAppHttpsUrl = ['https://', settings.vkAppUrl].join('');
	settings.chatUrl = 'ws://www.bazelevscontent.net:9009/';
	settings.previewGeneratorUrl = 'https://www.bazelevscontent.net:8893';
	settings.imageStoreBaseUrl = 'http://www.bazelevscontent.net:8582/';
	settings.layerImageStoreBaseUrl = 'https://www.bazelevscontent.net:8583/';
	settings.animationServiceUrl = 'https://www.bazelevscontent.net:8793';
})(settings);