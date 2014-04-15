var messenger;
(function (messenger) {
    var Settings = (function () {
        function Settings() {
        }
        Settings.version = 'content';

        Settings.publicIds = {
            'dev': 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9',
            'content': 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9',
            'release': 'public.7d90d69d-a990-483a-8567-ce51ea81f7b7'
        };

        Settings.vkAppUrls = {
            'dev': 'vk.com/app4222414',
            'content': 'vk.com/app4214902',
            'release': 'vk.com/toome_app'
        };

        Settings.chatUrls = {
            'dev': 'wss://www.bazelevscontent.net:4443/9012/',
            'content': 'wss://www.bazelevscontent.net/9009/',
            'release': 'wss://www.bazelevscontent.net/9009/'
        };

        Settings.previewGeneratorUrls = {
            'dev': 'https://www.bazelevscontent.net:4443/8894/',
            'content': 'https://www.bazelevscontent.net/8892/',
            'release': 'https://www.bazelevscontent.net/8892/'
        };

        Settings.imageStoreBaseUrls = {
            'dev': 'https://do7qxewf181q3.cloudfront.net/8584/',
            'content': 'https://do7qxewf181q3.cloudfront.net/8582/',
            'release': 'https://do7qxewf181q3.cloudfront.net/8582/'
        };

        Settings.layerImageStoreBaseUrls = {
            'dev': 'https://do7qxewf181q3.cloudfront.net/8584/',
            'content': 'https://do7qxewf181q3.cloudfront.net/8582/',
            'release': 'https://do7qxewf181q3.cloudfront.net/8582/'
        };

        Settings.animationServiceUrls = {
            'dev': 'https://www.bazelevscontent.net:4443/8794/',
            'content': 'https://www.bazelevscontent.net/8792/',
            'release': 'https://www.bazelevscontent.net/8792/'
        };

        Settings.vkGroupBaseUrls = {
            'page': 'https://vk.com/public',
            'group': 'https://vk.com/club',
            'event': 'https://vk.com/event'
        };

        Settings.publicId = Settings.publicIds[Settings.version];
        Settings.vkAppUrl = Settings.vkAppUrls[Settings.version];
        Settings.vkAppHttpUrl = ['http://', Settings.vkAppUrl].join('');
        Settings.vkAppHttpsUrl = ['https://', Settings.vkAppUrl].join('');
        Settings.shareMessageBaseUrl = 'https://bazelevscontent.net/multmessenger_release/share.html?ids=msg.';
        Settings.characterListUrl = 'https://bazelevshosting.net/MCM/characters_resources.json';
        Settings.chatUrl = Settings.chatUrls[Settings.version];
        Settings.previewGeneratorUrl = Settings.previewGeneratorUrls[Settings.version];
        Settings.imageStoreBaseUrl = Settings.imageStoreBaseUrls[Settings.version];
        Settings.layerImageStoreBaseUrl = Settings.layerImageStoreBaseUrls[Settings.version];
        Settings.animationServiceUrl = Settings.animationServiceUrls[Settings.version];
        Settings.groupUrl = 'https://vk.com/toome_mobi';
        Settings.vkContactBaseUrl = 'https://vk.com/id';
        Settings.abilityBaseUrl = 'https://bazelevshosting.net/MCM/';
        Settings.emptyPreviewUrl = 'images/emptyPreview.png';
        return Settings;
    })();
    messenger.Settings = Settings;
})(messenger || (messenger = {}));
