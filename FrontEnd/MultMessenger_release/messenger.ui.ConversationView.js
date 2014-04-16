/// <reference path="eye.ts" />
/// <reference path="deep.ts" />
/// <reference path="messenger.Settings.ts" />
/// <reference path="messenger.data.ts" />
/// <reference path="messenger.ui.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    (function (ui) {
        var ConversationView = (function (_super) {
            __extends(ConversationView, _super);
            function ConversationView() {
                _super.call(this);
                this.elem = eye.template({
                    templateId: 'conversation-template',
                    className: 'conversation'
                });
            }
            return ConversationView;
        })(ui.ControlView);
        ui.ConversationView = ConversationView;

        var TapeItemView = (function (_super) {
            __extends(TapeItemView, _super);
            function TapeItemView() {
                _super.apply(this, arguments);
            }
            return TapeItemView;
        })(ui.ControlView);

        var MessageControlsView = (function (_super) {
            __extends(MessageControlsView, _super);
            function MessageControlsView(message) {
                var _this = this;
                _super.call(this);

                this.model = message;

                this.elem = eye.template({
                    templateId: 'message-controls-template',
                    className: 'message-controls'
                });

                this.dateHolderElem = this.elem.getElementsByClassName('date-holder')[0];
                this.timeElem = this.dateHolderElem.getElementsByClassName('time')[0];
                this.dateElem = this.dateHolderElem.getElementsByClassName('date')[0];

                this.answerElem = this.elem.getElementsByClassName('answer')[0];
                this.wallElem = this.elem.getElementsByClassName('wall')[0];
                this.urlElem = this.elem.getElementsByClassName('url')[0];

                var answerElemClickListener = function () {
                    _this.trigger('click:answer');
                };
                var wallElemClickListener = function () {
                    _this.trigger('click:wall');
                };
                var urlElemClickListener = function () {
                    _this.trigger('click:url');
                };

                this.answerElem.addEventListener('click', answerElemClickListener);
                this.wallElem.addEventListener('click', wallElemClickListener);
                this.urlElem.addEventListener('click', urlElemClickListener);

                this.once('dispose', function () {
                    _this.answerElem.removeEventListener('click', answerElemClickListener);
                    _this.wallElem.removeEventListener('click', wallElemClickListener);
                    _this.urlElem.removeEventListener('click', urlElemClickListener);
                });

                var updateTimeElement = function () {
                    var setTime = function (timeModel) {
                        if (timeModel.get('isToday')) {
                            _this.timeElem.textContent = timeModel.get('time');
                            _this.timeElem.classList.remove('hidden');
                        } else {
                            _this.dateElem.textContent = timeModel.get('date');
                            _this.timeElem.textContent = timeModel.get('time');
                            _this.dateElem.classList.remove('hidden');
                            _this.dateHolderElem.addEventListener('mouseover', function () {
                                _this.timeElem.classList.remove('hidden');
                            });
                            _this.dateHolderElem.addEventListener('mouseout', function () {
                                _this.timeElem.classList.add('hidden');
                            });
                        }
                    };
                    var timestamp = _this.model.get('timestamp');
                    if (timestamp) {
                        var timeModel = new messenger.data.TimeModel(timestamp);
                        setTime(timeModel);
                    } else {
                        _this.timeElem.textContent = 'Отправка...';
                        _this.model.once('set:timestamp', function (e) {
                            var timeModel = new messenger.data.TimeModel(e.value);
                            setTime(timeModel);
                        });
                    }
                };
                updateTimeElement();
            }
            MessageControlsView.prototype.hideAnswerButton = function () {
                this.answerElem.classList.add('hidden');
            };
            MessageControlsView.prototype.hideWallButton = function () {
                this.wallElem.classList.add('hidden');
            };
            MessageControlsView.prototype.hideUrlButton = function () {
                this.urlElem.classList.add('hidden');
            };
            return MessageControlsView;
        })(ui.ControlView);

        var TextMessageView = (function (_super) {
            __extends(TextMessageView, _super);
            function TextMessageView(chatMessage) {
                _super.call(this);

                this.model = chatMessage;

                this.elem = eye.template({
                    templateId: 'text-message-template',
                    className: 'text-message'
                });
                this.contentElem = this.elem.getElementsByClassName('content')[0];
                this.contentElem.innerHTML = chatMessage.get('content');
            }
            return TextMessageView;
        })(ui.ControlView);

        var TextUserView = (function (_super) {
            __extends(TextUserView, _super);
            function TextUserView(user) {
                var _this = this;
                _super.call(this);

                this.model = user;

                this.elem = eye.template({
                    templateId: 'text-user-template',
                    className: 'text-user'
                });
                this.nameElem = this.elem.getElementsByClassName('name')[0];
                this.nameElem.textContent = this.model.getFullName();

                var updateOnlineStatus = function (online) {
                    if (online) {
                        _this.elem.classList.remove('offline');
                    } else {
                        _this.elem.classList.add('online');
                    }
                };
                var nameElemClickListener = function () {
                    var id = _this.model.get('id');
                    var vkLink = [messenger.Settings.vkContactBaseUrl, id].join('');
                    window.open(vkLink, '_blank');
                };
                var userSetOnlineListener = function (e) {
                    updateOnlineStatus(e.value);
                };

                this.model.on('set:online', userSetOnlineListener);
                updateOnlineStatus(this.model.get('online'));
                this.nameElem.addEventListener('click', nameElemClickListener);

                this.once('dispose', function () {
                    _this.model.off('set:online', userSetOnlineListener);
                    _this.nameElem.removeEventListener('click', nameElemClickListener);
                });
            }
            return TextUserView;
        })(ui.ControlView);
    })(messenger.ui || (messenger.ui = {}));
    var ui = messenger.ui;
})(messenger || (messenger = {}));
