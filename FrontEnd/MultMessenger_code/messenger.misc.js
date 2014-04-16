/// <reference path="q.d.ts" />
/// <reference path="eye.ts" />
/// <reference path="deep.ts" />
/// <reference path="messenger.data.ts" />
/// <reference path="messenger.Settings.ts" />
/// <reference path="messenger.chat.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    'use strict';

    (function (misc) {
        (function (ErrorCodes) {
            ErrorCodes[ErrorCodes["NO_CONNECTION"] = 1] = "NO_CONNECTION";
            ErrorCodes[ErrorCodes["API_ERROR"] = 2] = "API_ERROR";
            ErrorCodes[ErrorCodes["TIMEOUT"] = 4] = "TIMEOUT";
            ErrorCodes[ErrorCodes["RESTRICTED"] = 8] = "RESTRICTED";
        })(misc.ErrorCodes || (misc.ErrorCodes = {}));
        var ErrorCodes = misc.ErrorCodes;

        var DelayedObserver = (function (_super) {
            __extends(DelayedObserver, _super);
            function DelayedObserver(value, delay) {
                _super.call(this);

                this.value = value;
                this.delay = delay || 800;
            }
            DelayedObserver.prototype.getDelay = function () {
                return this.delay;
            };
            DelayedObserver.prototype.setDelay = function (delay) {
                this.delay = delay;
            };

            DelayedObserver.prototype.setValue = function (value) {
                var _this = this;
                if (this.timeoutHandler) {
                    clearTimeout(this.timeoutHandler);
                    this.timeoutHandler = null;
                }
                if (value !== this.value) {
                    this.timeoutHandler = setTimeout(function () {
                        _this.value = value;
                        _this.trigger({
                            type: 'change:value',
                            value: _this.value
                        });
                    }, this.delay);
                }
            };

            DelayedObserver.prototype.on = function (type, callback, context) {
                _super.prototype.on.call(this, type, callback, context);
            };
            return DelayedObserver;
        })(deep.EventEmitter);
        misc.DelayedObserver = DelayedObserver;

        (function (MessageTargets) {
            MessageTargets[MessageTargets["Self"] = 0] = "Self";
            MessageTargets[MessageTargets["Friend"] = 1] = "Friend";
            MessageTargets[MessageTargets["Group"] = 2] = "Group";
        })(misc.MessageTargets || (misc.MessageTargets = {}));
        var MessageTargets = misc.MessageTargets;

        var Helper = (function () {
            function Helper() {
            }
            Helper.buildVkId = function (contact) {
                var contactId = contact.get('id');
                if (contactId >= 0) {
                    return ['vkid', contactId].join('');
                } else {
                    var type = contact.get('type');
                    return ['vk', type, -contactId].join('');
                }
            };

            Helper.buildFbId = function (contact) {
                var contactId = contact.get('id');
                return ['fbid', contactId].join('');
            };

            Helper.messageTargetToString = function (messageTarget) {
                var result;
                switch (messageTarget) {
                    case 1 /* Friend */:
                        result = 'friend';
                        break;
                    case 2 /* Group */:
                        result = 'group';
                        break;
                    case 0 /* Self */:
                        result = 'self';
                        break;
                }
                return result;
            };

            Helper.getMessageTarget = function (sender, receiver) {
                var senderId = sender.get('id');
                var receiverId = receiver.get('id');
                if (senderId === receiverId) {
                    return 0 /* Self */;
                } else if (receiverId < 0) {
                    return 2 /* Group */;
                } else {
                    return 1 /* Friend */;
                }
            };

            Helper.normalizeMessageContent = function (content) {
                var wkTransformPattern = /(-webkit-transform:([^;]*);)/g;
                var mozTransformPattern = /(-moz-transform:([^;]*);)/g;
                var msTransformPattern = /(-ms-transform:([^;]*);)/g;
                var transformPattern = /([^-]transform:([^;]*);)/g;
                var wkTransformRepeatPattern = /(\s*-webkit-transform:([^;]*);\s*)+/g;

                var buildWkTransform = function (transformValue) {
                    return ['-webkit-transform:', transformValue, ';'].join('');
                };
                var buildMozTransform = function (transformValue) {
                    return ['-moz-transform:', transformValue, ';'].join('');
                };
                var buildMsTransform = function (transformValue) {
                    return ['-ms-transform:', transformValue, ';'].join('');
                };
                var buildTransform = function (transformValue) {
                    return ['transform:', transformValue, ';'].join('');
                };
                var replaceTransform = function (match, transform, transformValue) {
                    return [
                        buildWkTransform(transformValue),
                        buildMozTransform(transformValue),
                        buildMsTransform(transformValue),
                        buildTransform(transformValue)
                    ].join(' ');
                };
                var replaceWkTransform = function (match, transform, transformValue) {
                    return buildWkTransform(transformValue);
                };

                return content.replace(mozTransformPattern, replaceWkTransform).replace(msTransformPattern, replaceWkTransform).replace(transformPattern, replaceWkTransform).replace(wkTransformRepeatPattern, replaceTransform).replace(mozTransformPattern, replaceWkTransform).replace(msTransformPattern, replaceWkTransform).replace(transformPattern, replaceWkTransform).replace(wkTransformRepeatPattern, replaceTransform);
            };

            Helper.calculateMessageShareUrl = function (messageId) {
                return [messenger.Settings.shareMessageBaseUrl, messageId].join('');
            };

            Helper.generatePreviewAsync = function (messageShareUrl, uploadUrl) {
                var requestData = {
                    uploadUrl: uploadUrl,
                    url: messageShareUrl,
                    imageFormat: 'png',
                    scale: 1,
                    contentType: uploadUrl ? 'vkUpload' : 'share'
                };
                var rawRequestData = JSON.stringify(requestData);
                var options = {
                    url: messenger.Settings.previewGeneratorUrl,
                    method: 'POST',
                    data: 'type=render&data=' + encodeURIComponent(rawRequestData)
                };
                return eye.requestAsync(options).then(function (rawData) {
                    return JSON.parse(rawData);
                });
            };

            Helper.createVkPost = function (messageId, senderId, receiverId, imageId) {
                var content = null;
                var appUrl = messenger.Settings.vkAppUrl;
                var hash = ['senderId=', senderId, '&messageId=', messageId].join('');
                var answerUrl = [appUrl, '#', hash].join('');
                var fullAnswerUrl = ['https://', answerUrl].join('');

                if (senderId === receiverId) {
                    content = 'Мой мульт!\nСмотреть: ';
                } else if (receiverId < 0) {
                    content = 'Зацените мульт!\nСмотреть: ';
                } else {
                    content = 'Тебе мульт!\nСмотреть: ';
                }

                return {
                    owner_id: receiverId,
                    message: [content, answerUrl].join(''),
                    attachments: [imageId, fullAnswerUrl].join(','),
                    v: 5.12
                };
            };

            Helper.formatError = function (error) {
                var result = [];
                var mainResult = error.errorCode === 8 /* RESTRICTED */ ? 'reject' : 'fail';
                result.push(mainResult);
                if (mainResult === 'fail') {
                    var message = error.message || {};
                    if (message.error_code) {
                        result.push(message.error_code);
                    }
                    if (message.error_msg) {
                        result.push(message.error_msg);
                    }
                }
                return result.join('_');
            };
            return Helper;
        })();
        misc.Helper = Helper;

        var ChatClientWrapper = (function () {
            function ChatClientWrapper(chatClient) {
                this.operationTimeout = 600000;
                this.chatClient = chatClient;
            }
            ChatClientWrapper.prototype.getChatClient = function () {
                return this.chatClient;
            };

            ChatClientWrapper.prototype.createRequestTask = function (checkReadyState, operationTimeout) {
                var task = Q.defer();
                if (checkReadyState && this.chatClient.readyState() !== 1) {
                    task.reject({
                        errorCode: 1 /* NO_CONNECTION */
                    });
                } else {
                    setTimeout(function () {
                        task.reject({
                            errorCode: 4 /* TIMEOUT */
                        });
                    }, operationTimeout || this.operationTimeout);
                }
                return task;
            };

            ChatClientWrapper.prototype.connectAsync = function () {
                var task = this.createRequestTask();

                this.chatClient.once('connect', function () {
                    task.resolve(null);
                });
                this.chatClient.connect();

                return task.promise;
            };

            ChatClientWrapper.prototype.loginAsync = function (account) {
                var task = this.createRequestTask();

                this.chatClient.once('message:login', function () {
                    task.resolve(null);
                });
                this.chatClient.login(account);

                return task.promise;
            };

            ChatClientWrapper.prototype.connectAndLoginAsync = function (account) {
                var _this = this;
                return this.connectAsync().then(function () {
                    return _this.loginAsync(account);
                });
            };

            ChatClientWrapper.prototype.getMessageIdsAsync = function (groupId, count, offset) {
                var task = this.createRequestTask(true);

                this.chatClient.once('message:grouptape', function (e) {
                    var grouptape = e.response.grouptape;
                    if (grouptape.success) {
                        task.resolve({
                            messagecount: grouptape.messagecount,
                            data: grouptape.data
                        });
                    } else {
                        task.resolve({
                            messagecount: 0,
                            data: []
                        });
                    }
                });
                this.chatClient.grouptape(groupId, count, offset);

                return task.promise;
            };

            ChatClientWrapper.prototype.getMessagesAsync = function (messageIds) {
                var task = this.createRequestTask(true);

                this.chatClient.once('message:retrieve', function (e) {
                    var rawMessages = e.response.retrieve;
                    task.resolve(rawMessages);
                });
                this.chatClient.retrieve(messageIds.join(','));

                return task.promise;
            };

            ChatClientWrapper.prototype.getProfileAsync = function (profileId) {
                var task = this.createRequestTask(true);

                this.chatClient.once('message:retrieve', function (e) {
                    var profile = e.response.retrieve[0];
                    task.resolve(profile);
                });
                this.chatClient.retrieve(profileId);

                return task.promise;
            };

            ChatClientWrapper.prototype.saveProfileAsync = function (profileId, data) {
                this.chatClient.store(null, profileId, data);
                return Q.resolve(true);
            };

            ChatClientWrapper.prototype.nowAsync = function (timeout) {
                var task = this.createRequestTask(true, timeout);

                this.chatClient.once('message:now', function (e) {
                    var timestamp = e.response.now;
                    task.resolve(timestamp);
                });
                this.chatClient.now();

                return task.promise;
            };

            ChatClientWrapper.prototype.sendMessageAsync = function (message) {
                var task = this.createRequestTask(true);

                this.chatClient.once('message:send', function (e) {
                    var rawMessage = e.response.send;
                    task.resolve(rawMessage);
                });
                this.chatClient.once('message:sent', function (e) {
                    var rawMessage = e.response.sent;
                    task.resolve(rawMessage);
                });
                this.chatClient.sendMessage(message);

                return task.promise;
            };

            ChatClientWrapper.prototype.loadTapeAsync = function () {
                var task = this.createRequestTask(true);

                this.chatClient.once('message:tape', function (e) {
                    var tape = e.response.tape;
                    task.resolve(tape);
                });
                this.chatClient.tape();

                return task.promise;
            };
            return ChatClientWrapper;
        })();
        misc.ChatClientWrapper = ChatClientWrapper;
    })(messenger.misc || (messenger.misc = {}));
    var misc = messenger.misc;
})(messenger || (messenger = {}));
