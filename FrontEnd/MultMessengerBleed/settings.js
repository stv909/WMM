var settings = settings || {};

(function(settings) {
	settings.shareMessageBaseUrl = 'http://bazelevscontent.net/WMM/share.html?ids=msg.';
	settings.imageUploadServiceUrl = 'http://bazelevscontent.net:9090/'; //'https://wmm-c9-stv909.c9.io';
	settings.vkAppUrl = 'vk.com/app4222414';
	settings.vkAppHttpUrl = ['http://', settings.vkAppUrl].join('');
	settings.vkAppHttpsUrl = ['https://', settings.vkAppUrl].join('');
	settings.chatUrl = 'ws://www.bazelevscontent.net:9009/';
	settings.previewGeneratorUrl = 'https://www.bazelevscontent.net:8893';
	settings.imageStoreBaseUrl = 'http://www.bazelevscontent.net:8582/';
	settings.layerImageStoreBaseUrl = 'https://www.bazelevscontent.net:8583/';
	settings.animationServiceUrl = 'https://www.bazelevscontent.net:8793';
})(settings);