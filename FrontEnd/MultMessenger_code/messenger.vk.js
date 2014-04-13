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
    })(messenger.vk || (messenger.vk = {}));
    var vk = messenger.vk;
})(messenger || (messenger = {}));
