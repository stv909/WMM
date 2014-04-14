/// <reference path="q.d.ts" />
/// <reference path="messenger.misc.ts" />
var messenger;
(function (messenger) {
    (function (vk) {
        function apiAsync(method, params) {
            var deferred = Q.defer();

            VK.api(method, params, function (data) {
                if (data.hasOwnProperty('response')) {
                    deferred.resolve(data.response);
                } else {
                    deferred.reject({
                        errorCode: 2 /* API_ERROR */,
                        message: data.error
                    });
                }
            });

            return deferred.promise;
        }
        vk.apiAsync = apiAsync;

        function initAsync() {
            var deferred = Q.defer();

            VK.init(function () {
                deferred.resolve(true);
            }, function () {
                deferred.reject({
                    errorCode: 2 /* API_ERROR */
                });
            }, 5.12);

            return deferred.promise;
        }
        vk.initAsync = initAsync;

        function callMethod(method) {
            VK.callMethod(method);
        }
        vk.callMethod = callMethod;

        function getWallUploadServerAsync() {
            return apiAsync('photo.getWallUploadServer', {
                v: 5.12
            }).then(function (response) {
                return response.upload_url;
            });
        }
        vk.getWallUploadServerAsync = getWallUploadServerAsync;

        function saveWallPhotoAsync(params) {
            params.v = params.v || 5.12;
            return apiAsync('photos.saveWallPhoto', params);
        }
        vk.saveWallPhotoAsync = saveWallPhotoAsync;

        function getUploadedFileId(response) {
            return ['photo', response[0].owner_id, '_', response[0].id].join('');
        }
        vk.getUploadedFileId = getUploadedFileId;
    })(messenger.vk || (messenger.vk = {}));
    var vk = messenger.vk;
})(messenger || (messenger = {}));
