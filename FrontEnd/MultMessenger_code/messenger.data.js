/// <reference path="q.d.ts" />
/// <reference path="base64.d.ts" />
/// <reference path="deep.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="messenger.vk.ts" />
/// <reference path="messenger.chat.ts" />
/// <reference path="messenger.Settings.ts" />
var messenger;
(function (messenger) {
    'use strict';

    (function (data) {
        var UserModel = (function (_super) {
            __extends(UserModel, _super);
            function UserModel() {
                _super.apply(this, arguments);
            }
            UserModel.prototype.getFullName = function () {
                return [this.get('firstName'), this.get('lastName')].join(' ');
            };

            UserModel.prototype.isAppUserAsync = function () {
                var _this = this;
                return messenger.vk.apiAsync('users.isAppUser', {
                    user_id: this.get('id'),
                    v: 5.12
                }).then(function (response) {
                    _this.set('isAppUser', response);
                    return response;
                });
            };

            UserModel.prototype.isCanPostAsync = function () {
                var _this = this;
                return messenger.vk.apiAsync('users.get', {
                    user_ids: this.get('id'),
                    fields: 'can_post'
                }).then(function (response) {
                    var rawUser = response[0];
                    _this.set('canPost', rawUser.can_post);
                    return rawUser.can_post;
                });
            };

            UserModel.fromRaw = function (rawUser) {
                var user = new UserModel();

                user.set({
                    id: rawUser.id,
                    firstName: rawUser.first_name,
                    lastName: rawUser.last_name,
                    photo: rawUser.photo_200 || rawUser.photo_100 || rawUser.photo_50,
                    canPost: rawUser.can_post,
                    unread: 0,
                    online: false
                });

                return user;
            };

            UserModel.loadOwnAsync = function () {
                return messenger.vk.apiAsync('users.get', {
                    fields: ['photo_200', 'photo_100', 'photo_50', 'can_post'].join(','),
                    name_case: 'nom',
                    https: 1,
                    v: 5.12
                }).then(function (response) {
                    return UserModel.fromRaw(response[0]);
                });
            };

            UserModel.loadByIdAsync = function (id) {
                return messenger.vk.apiAsync('users.get', {
                    user_ids: id,
                    fields: ['photo_200', 'photo_100', 'photo_50', 'can_post'].join(','),
                    name_case: 'nom',
                    https: 1,
                    v: 5.12
                }).then(function (response) {
                    return UserModel.fromRaw(response[0]);
                });
            };

            UserModel.loadFriendsChunkAsync = function (count, offset) {
                return messenger.vk.apiAsync('friends.get', {
                    count: count,
                    offset: offset,
                    fields: ['photo_200', 'photo_100', 'photo_50', 'can_post'].join(','),
                    name_case: 'nom',
                    https: 1,
                    v: 5.12
                }).then(function (response) {
                    return response.items.map(UserModel.fromRaw);
                });
            };
            return UserModel;
        })(ContactModel);
        data.UserModel = UserModel;

        var GroupModel = (function (_super) {
            __extends(GroupModel, _super);
            function GroupModel() {
                _super.apply(this, arguments);
            }
            GroupModel.prototype.isAppUserAsync = function () {
                return Q.resolve(true);
            };

            GroupModel.prototype.isCanPostAsync = function () {
                return Q.resolve(true);
            };

            GroupModel.fromRaw = function (rawGroup) {
                var group = new GroupModel();

                group.set({
                    id: -rawGroup.id,
                    name: rawGroup.name,
                    photo: rawGroup.photo_200 || rawGroup.photo_100 || rawGroup.photo_50,
                    type: rawGroup.type,
                    canPost: rawGroup.can_post
                });

                return group;
            };

            GroupModel.loadChunkAsync = function (count, offset) {
                return messenger.vk.apiAsync('groups.get', {
                    extended: 1,
                    fields: ['photo_200', 'photo_100', 'photo_50', 'can_post'].join(','),
                    offset: offset,
                    count: count,
                    https: 1,
                    v: 5.12
                }).then(function (response) {
                    return response.items.map(GroupModel.fromRaw);
                });
            };
            return GroupModel;
        })(ContactModel);
        data.GroupModel = GroupModel;

        var MessageModel = (function (_super) {
            __extends(MessageModel, _super);
            function MessageModel() {
                _super.apply(this, arguments);
            }
            MessageModel.prototype.isValid = function () {
                return !!this.get('preview');
            };

            MessageModel.fromRaw = function (messageResponse) {
                var value = messageResponse.value || {};
                var message = new MessageModel();
                message.set({
                    id: value.id || -1,
                    content: value.content ? base64.decode(value.content) : '',
                    preview: value.preview ? [messenger.Settings.imageStoreBaseUrl, value.preview].join('') : null
                });
                return message;
            };

            MessageModel.default = function () {
                var message = new MessageModel();
                message.set({
                    id: '42',
                    preview: 'https://www.bazelevscontent.net:8583/8b8cdae3-8842-4ecd-a067-ccda2cfe56f8.png',
                    content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(https://lh6.googleusercontent.com/-pDyo6bISP5s/UwXAANbCjXI/AAAAAAAAFus/rbcJ2tUev7g/w448-h328-no/office_dresscode_2_back.png); background-size: auto; width: 403px; height: 403px; background-position: 0% 21%; background-repeat: no-repeat no-repeat;"><div class="tool_layerItem_ece920e7-b59b-4c00-9cc5-b4d093fd8a1a layerType_text" draggable="true" style="font-family: Impact; font-size: 1.9em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 5; left: 9px; top: 339px; -webkit-transform: rotate(0deg);">И НЕ НАДЕЛ ГАЛСТУК НА РАБОТУ</div><div class="tool_layerItem_cdd13bc9-151d-463a-bff7-f8f6f1f978a5 layerType_text" draggable="true" style="font-family: Impact; font-size: 1.5em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 4; left: 60px; top: 11px; -webkit-transform: rotate(0deg);">РЕШИЛ БЫТЬ САМИМ СОБОЙ</div><img src="https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;borac&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;happy&lt;/mood&gt;&lt;action&gt;point&lt;/action&gt;Ай эм секси энд ай ноу ит!&lt;gag&gt;party&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif&quot;}" class="tool_layerItem_5025a450-13c9-40a4-8410-94a1a1d30628 layerType_actor" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(0.5133420832795046) rotate(0deg); left: 96px; top: -87px; pointer-events: auto;"><img src="https://lh5.googleusercontent.com/-eI04EqemiLY/UwXAC7AICAI/AAAAAAAAFvU/_2AnZWHqjvs/w448-h328-no/office_dresscode_2_front.png" class="tool_layerItem_ff203327-3bd4-46a8-a0bc-98c5e38b342e layerType_img" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(1) rotate(0deg); left: -25px; top: 16px;"><img src="https://lh3.googleusercontent.com/--kaLl9jd890/UwXfgRqfPGI/AAAAAAAAFx0/qACqaTb0MjA/s403-no/7.png" class="tool_layerItem_312b95b5-4b85-4fea-b464-29510fc69ee9 layerType_img" draggable="true" style="position: absolute; z-index: 3; -webkit-transform: scale(1) rotate(0deg); left: 0px; top: 0px;"><div class="tool_layerItem_0cfd1126-2616-4977-808d-01e2201f258f layerType_text" draggable="true" style="font-family: Impact; font-size: 1em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 6; -webkit-transform: rotate(0deg); left: 107px; top: 376px;">НУ МОЖЕТ НЕ ТОЛЬКО ГАЛСТУК</div></div>'
                });
                return message;
            };

            MessageModel.prototype.on = function (type, callback, context) {
                _super.prototype.on.call(this, type, callback, context);
            };

            MessageModel.prototype.once = function (type, callback, context) {
                _super.prototype.once.call(this, type, callback, context);
            };
            return MessageModel;
        })(deep.Model);
        data.MessageModel = MessageModel;
    })(messenger.data || (messenger.data = {}));
    var data = messenger.data;
})(messenger || (messenger = {}));
