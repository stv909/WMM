/// <reference path="messenger.ui.ts" />
/// <reference path="messenger.misc.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    'use strict';

    (function (ui) {
        var ErrorCodes = messenger.misc.ErrorCodes;

        var PreloaderView = (function (_super) {
            __extends(PreloaderView, _super);
            function PreloaderView() {
                _super.call(this);
                this.elem = document.getElementById('preload-background');
            }
            return PreloaderView;
        })(ui.ControlView);
        ui.PreloaderView = PreloaderView;

        var ErrorDialogView = (function (_super) {
            __extends(ErrorDialogView, _super);
            function ErrorDialogView() {
                var _this = this;
                _super.call(this, 'error-dialog');

                this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];
                this.statusElem = this.dialogWindowElem.getElementsByClassName('status')[0];

                var okElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:ok');
                };

                this.okElem.addEventListener('click', okElemClickListener);

                this.once('dispose', function () {
                    _this.okElem.removeEventListener('click', okElemClickListener);
                });
            }
            ErrorDialogView.prototype.setError = function (error) {
                switch (error.errorCode) {
                    case 1 /* NO_CONNECTION */:
                        this.statusElem.textContent = 'Не удалось выполнить операцию.\nПроверьте интернет-подключение и\nпопробуйте позже.';
                        break;
                    case 2 /* API_ERROR */:
                        this.statusElem.textContent = 'Ошибка вызова интернет-сервиса.';
                        break;
                    case 4 /* TIMEOUT */:
                        this.statusElem.textContent = 'Не удалось выполнить операцию.\nПроверьте интернет-подключение и\nпопробуйте позже.';
                        break;
                    default:
                }
            };
            return ErrorDialogView;
        })(ui.DialogView);
        ui.ErrorDialogView = ErrorDialogView;

        var InviteUserDialogView = (function (_super) {
            __extends(InviteUserDialogView, _super);
            function InviteUserDialogView() {
                var _this = this;
                _super.call(this, 'invite-user-dialog');

                this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];
                this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];

                var okElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:ok');
                };
                var cancelElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:cancel');
                };

                this.okElem.addEventListener('click', okElemClickListener);
                this.cancelElem.addEventListener('click', cancelElemClickListener);

                this.once('dispose', function () {
                    _this.okElem.removeEventListener('click', okElemClickListener);
                    _this.cancelElem.removeEventListener('click', cancelElemClickListener);
                });
            }
            return InviteUserDialogView;
        })(ui.DialogView);
        ui.InviteUserDialogView = InviteUserDialogView;

        var SkipDialogView = (function (_super) {
            __extends(SkipDialogView, _super);
            function SkipDialogView() {
                var _this = this;
                _super.call(this, 'skip-answer-dialog');

                this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];
                this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];
                this.questionTextElem = this.dialogWindowElem.getElementsByClassName('answer-text')[0];

                var okElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:ok');
                };
                var cancelElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:cancel');
                };

                this.okElem.addEventListener('click', okElemClickListener);
                this.cancelElem.addEventListener('click', cancelElemClickListener);

                this.once('dispose', function () {
                    _this.okElem.removeEventListener('click', okElemClickListener);
                    _this.cancelElem.removeEventListener('click', cancelElemClickListener);
                });
            }
            SkipDialogView.prototype.getText = function () {
                return this.questionTextElem.textContent;
            };

            SkipDialogView.prototype.setText = function (text) {
                this.questionTextElem.textContent = text;
            };
            return SkipDialogView;
        })(ui.DialogView);
        ui.SkipDialogView = SkipDialogView;

        var CancelMessageUpdateDialogView = (function (_super) {
            __extends(CancelMessageUpdateDialogView, _super);
            function CancelMessageUpdateDialogView() {
                var _this = this;
                _super.call(this, 'ask-message-dialog');

                this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];
                this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];

                var okElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:ok');
                };
                var cancelElemClickListener = function () {
                    _this.hide();
                    _this.trigger('click:cancel');
                };

                this.okElem.addEventListener('click', okElemClickListener);
                this.cancelElem.addEventListener('click', cancelElemClickListener);

                this.once('dispose', function () {
                    _this.okElem.removeEventListener('click', okElemClickListener);
                    _this.cancelElem.removeEventListener('click', cancelElemClickListener);
                });
            }
            return CancelMessageUpdateDialogView;
        })(ui.DialogView);
        ui.CancelMessageUpdateDialogView = CancelMessageUpdateDialogView;

        var CreateTextMessageDialogView = (function (_super) {
            __extends(CreateTextMessageDialogView, _super);
            function CreateTextMessageDialogView() {
                var _this = this;
                _super.call(this, 'create-message-dialog');

                this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
                this.sendElem = this.dialogWindowElem.getElementsByClassName('send')[0];
                this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];
                this.messageTextElem = this.dialogWindowElem.getElementsByClassName('message-text')[0];

                this.documentKeydownListener = function (e) {
                    if (e.keyCode === 13) {
                        sendClickListener();
                    }
                };

                var emptyStringPattern = /^\s*$/;
                var cancelClickListener = function () {
                    _this.hide();
                    _this.messageTextElem.value = '';
                    _this.sendElem.classList.add('disabled');
                };
                var sendClickListener = function () {
                    var value = _this.messageTextElem.value;
                    if (!emptyStringPattern.test(value)) {
                        _this.trigger({
                            type: 'click:send',
                            text: value.replace(/\r?\n/g, '<br />')
                        });
                        _this.hide();
                        _this.messageTextElem.value = '';
                        _this.sendElem.classList.add('disabled');
                    }
                };
                var messageTextInputListener = function () {
                    if (emptyStringPattern.test(_this.messageTextElem.value)) {
                        _this.sendElem.classList.add('disabled');
                    } else {
                        _this.sendElem.classList.remove('disabled');
                    }
                };

                this.crossElem.addEventListener('click', cancelClickListener);
                this.cancelElem.addEventListener('click', cancelClickListener);
                this.sendElem.addEventListener('click', sendClickListener);
                this.messageTextElem.addEventListener('input', messageTextInputListener);

                this.once('dispose', function () {
                    _this.crossElem.addEventListener('click', cancelClickListener);
                    _this.cancelElem.addEventListener('click', cancelClickListener);
                    _this.sendElem.addEventListener('click', sendClickListener);
                    _this.messageTextElem.addEventListener('click', messageTextInputListener);
                });
            }
            CreateTextMessageDialogView.prototype.show = function () {
                _super.prototype.show.call(this);
                this.messageTextElem.focus();
                document.addEventListener('keydown', this.documentKeydownListener);
            };

            CreateTextMessageDialogView.prototype.hide = function () {
                _super.prototype.hide.call(this);
                document.removeEventListener('keydown', this.documentKeydownListener);
            };
            return CreateTextMessageDialogView;
        })(ui.DialogView);
        ui.CreateTextMessageDialogView = CreateTextMessageDialogView;
    })(messenger.ui || (messenger.ui = {}));
    var ui = messenger.ui;
})(messenger || (messenger = {}));
