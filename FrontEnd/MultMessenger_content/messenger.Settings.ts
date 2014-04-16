module messenger {

	export class Settings {
		public static version = 'content';

		public static publicIds = {
			'dev': 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9',
			'content': 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9',
			'release': 'public.7d90d69d-a990-483a-8567-ce51ea81f7b7'
		};

		public static vkAppUrls = {
			'dev': 'vk.com/app4222414',
			'content': 'vk.com/app4214902',
			'release': 'vk.com/toome_app'
		};

		public static chatUrls = {
			'dev': 'wss://www.bazelevscontent.net:4443/9012/',
			'content': 'wss://www.bazelevscontent.net/9009/',
			'release': 'wss://www.bazelevscontent.net/9009/'
		};

		public static previewGeneratorUrls = {
			'dev': 'https://www.bazelevscontent.net:4443/8894/',
			'content': 'https://www.bazelevscontent.net/8892/',
			'release': 'https://www.bazelevscontent.net/8892/'
		};

		public static imageStoreBaseUrls = {
			'dev': 'https://do7qxewf181q3.cloudfront.net/8584/',
			'content': 'https://do7qxewf181q3.cloudfront.net/8582/',
			'release': 'https://do7qxewf181q3.cloudfront.net/8582/'
		};

		public static layerImageStoreBaseUrls = {
			'dev': 'https://do7qxewf181q3.cloudfront.net/8584/',
			'content': 'https://do7qxewf181q3.cloudfront.net/8582/',
			'release': 'https://do7qxewf181q3.cloudfront.net/8582/'
		};

		public static animationServiceUrls = {
			'dev': 'https://www.bazelevscontent.net:4443/8794/',
			'content': 'https://www.bazelevscontent.net/8792/',
			'release': 'https://www.bazelevscontent.net/8792/'
		};

		public static vkGroupBaseUrls = {
			'page': 'https://vk.com/public',
			'group': 'https://vk.com/club',
			'event': 'https://vk.com/event'
		};

		public static publicId = Settings.publicIds[Settings.version];
		public static vkAppUrl = Settings.vkAppUrls[Settings.version];
		public static vkAppHttpUrl = ['http://', Settings.vkAppUrl].join('');
		public static vkAppHttpsUrl = ['https://', Settings.vkAppUrl].join('');
		public static shareMessageBaseUrl = 'https://bazelevscontent.net/multmessenger_release/share.html?ids=msg.';
		public static characterListUrl = 'https://bazelevshosting.net/MCM/characters_resources.json';
		public static chatUrl = Settings.chatUrls[Settings.version];
		public static previewGeneratorUrl = Settings.previewGeneratorUrls[Settings.version];
		public static imageStoreBaseUrl = Settings.imageStoreBaseUrls[Settings.version];
		public static layerImageStoreBaseUrl = Settings.layerImageStoreBaseUrls[Settings.version];
		public static animationServiceUrl = Settings.animationServiceUrls[Settings.version];
		public static groupUrl = 'https://vk.com/toome_mobi';
		public static vkContactBaseUrl = 'https://vk.com/id';
		public static abilityBaseUrl = 'https://bazelevshosting.net/MCM/';
		public static emptyPreviewUrl = 'images/emptyPreview.png';
	}
}