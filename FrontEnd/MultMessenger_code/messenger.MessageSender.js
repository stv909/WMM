/// <reference path="q.d.ts" />
/// <reference path="eye.ts" />
/// <reference path="deep.ts" />
/// <reference path="messenger.chat.ts" />
/// <reference path="messenger.data.ts" />
/// <reference path="messenger.misc.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    var MessageFactory = messenger.chat.MessageFactory;

    var Helper = messenger.misc.Helper;

    var MessageSender = (function (_super) {
        __extends(MessageSender, _super);
        function MessageSender(chatClientWrapper, awaitToken) {
            _super.call(this);
            this.chatClientWrapper = chatClientWrapper;
            this.awaitToken = awaitToken;
        }
        MessageSender.prototype.send = function (sender, receiver, content) {
            var _this = this;
            var rawMessage = MessageSender.createRawMessage(sender, receiver, content);
            var messageTarget = Helper.getMessageTarget(sender, receiver);
            var shareMessageUrl = Helper.calculateMessageShareUrl(rawMessage.id);

            this.trigger('send:start');

            this.awaitToken().then(function () {
                _this.trigger('send:create-message');
                return _this.chatClientWrapper.nowAsync();
            }, function () {
                _this.trigger('send:await-fail');
                throw 'send:await-fail';
                return -1;
            }).then(function (timestamp) {
                _this.trigger('send:save-message');
                rawMessage.timestamp = timestamp;
                return _this.chatClientWrapper.sendMessageAsync(rawMessage);
            }).then(function () {
                _this.trigger('send:create-preview');
                return messenger.vk.getWallUploadServerAsync();
            }).then(function (uploadUrl) {
                return Helper.generatePreviewAsync(shareMessageUrl, uploadUrl);
            }).then(function (response) {
                var uploadResult = response.uploadResult;
                rawMessage.preview = response.image;
                _this.trigger({
                    type: 'send:save-preview',
                    rawMessage: rawMessage
                });
                _this.chatClientWrapper.getChatClient().notifyMessage(rawMessage);
                var isCanPostPromise = receiver.isCanPostAsync();
                var saveWallPhotoPromise = messenger.vk.saveWallPhotoAsync(uploadResult);
                return Q.all([isCanPostPromise, saveWallPhotoPromise]);
            }).spread(function (canPost, response) {
                if (canPost) {
                    _this.trigger('send:create-post');
                    var imageId = messenger.vk.getUploadedFileId(response);
                    var vkPost = Helper.createVkPost(rawMessage.id, sender.get('id'), receiver.get('id'), imageId);
                    return messenger.vk.apiAsync('wall.post', vkPost);
                } else {
                    _this.trigger({
                        type: 'send:wall-closed',
                        messageTarget: messageTarget,
                        receiver: receiver
                    });
                }
            }).then(function () {
                _this.trigger({
                    type: 'send:complete',
                    messageTarget: messageTarget,
                    receiver: receiver
                });
            }).catch(function (e) {
                console.log(e);
                _this.trigger({
                    type: 'send:fail',
                    error: e,
                    messageTarget: messageTarget,
                    receiver: receiver
                });
            }).done();
        };

        MessageSender.prototype.invite = function (receiver) {
            var _this = this;
            this.trigger('invite:start');
            receiver.isAppUserAsync().then(function (isAppUser) {
                if (isAppUser) {
                    _this.trigger('invite:always');
                } else {
                    _this.trigger({
                        type: 'invite:user',
                        user: receiver
                    });
                }
            }).catch(function () {
                _this.trigger('invite:fail');
            });
        };

        MessageSender.prototype.on = function (type, callback, context) {
            _super.prototype.on.call(this, type, callback, context);
        };

        MessageSender.createRawMessage = function (sender, receiver, content) {
            return MessageFactory.encode({
                id: eye.uuid(),
                content: Helper.normalizeMessageContent(content),
                from: Helper.buildVkId(sender),
                to: Helper.buildVkId(receiver)
            });
        };
        return MessageSender;
    })(deep.EventEmitter);
    messenger.MessageSender = MessageSender;
})(messenger || (messenger = {}));
