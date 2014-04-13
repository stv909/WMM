/// <reference path="eye.ts" />
/// <reference path="messenger.ui.ts" />
/// <reference path="messenger.data.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    (function (ui) {
        var MessageView = (function (_super) {
            __extends(MessageView, _super);
            function MessageView(model) {
                _super.call(this);
                this.selected = false;

                this.model = model;
                this.elem = eye.template({
                    templateId: 'message-template',
                    className: 'message'
                });
                this.contentElem = this.elem.getElementsByClassName('content')[0];
            }
            MessageView.prototype.on = function (type, callback, context) {
                _super.prototype.on.call(this, type, callback, context);
            };

            MessageView.prototype.once = function (type, callback, context) {
                _super.prototype.once.call(this, type, callback, context);
            };

            MessageView.prototype.select = function () {
                this.selected = true;
                this.elem.classList.add('chosen');
                this.elem.classList.remove('normal');
                this.removeCachedElem();
                this.addCachedElem(this.getCachedFullElem());
                this.trigger({
                    type: 'select',
                    message: this.model
                });
            };

            MessageView.prototype.deselect = function () {
                this.selected = false;
                this.elem.classList.remove('chosen');
                this.elem.classList.add('normal');
                this.removeCachedElem();
                this.addCachedElem(this.cachedPreviewElem);
            };

            MessageView.prototype.setModel = function (model, full) {
                this.model = model;
                this.removeCachedElem();
                this.prepareCachedPreviewElem();
                if (full) {
                    this.prepareCachedFullElem();
                }
                if (this.selected) {
                    this.addCachedElem(this.getCachedFullElem());
                } else {
                    this.addCachedElem(this.cachedPreviewElem);
                }
            };

            MessageView.prototype.addCachedElem = function (cachedElem) {
                this.cachedElem = cachedElem;
                this.contentElem.appendChild(this.cachedElem);
            };

            MessageView.prototype.removeCachedElem = function () {
                if (this.cachedElem) {
                    this.contentElem.removeChild(this.cachedElem);
                    this.cachedElem = null;
                }
            };

            MessageView.prototype.prepareCachedPreviewElem = function () {
                this.cachedPreviewElem = document.createElement('div');
                var imgElem = document.createElement('img');
                if (this.model.get('preview')) {
                    imgElem.src = this.model.get('preview');
                } else {
                    imgElem.src = messenger.Settings.emptyPreviewUrl;
                    this.model.once('set:preview', function (e) {
                        imgElem.src = e.value;
                    });
                }
                this.cachedPreviewElem.appendChild(imgElem);
            };

            MessageView.prototype.prepareCachedFullElem = function () {
                this.cachedFullElem = document.createElement('div');
                this.cachedFullElem.innerHTML = this.model.get('content');
            };

            MessageView.prototype.getCachedFullElem = function () {
                if (!this.cachedFullElem) {
                    this.prepareCachedFullElem();
                }
                return this.cachedFullElem;
            };
            return MessageView;
        })(ui.ControlView);
        ui.MessageView = MessageView;

        var MessagePatternView = (function (_super) {
            __extends(MessagePatternView, _super);
            function MessagePatternView(model) {
                var _this = this;
                _super.call(this, model);

                this.prepareCachedPreviewElem();
                this.deselect();

                var elemClickListener = function () {
                    if (!_this.selected) {
                        _this.select();
                        _this.trigger('click');
                    }
                };

                this.elem.addEventListener('click', elemClickListener);
                this.once('dispose', function () {
                    _this.elem.removeEventListener('click', elemClickListener);
                });
            }
            MessagePatternView.prototype.on = function (type, callback, context) {
                _super.prototype.on.call(this, type, callback, context);
            };

            MessagePatternView.prototype.once = function (type, callback, context) {
                _super.prototype.once.call(this, type, callback, context);
            };
            return MessagePatternView;
        })(MessageView);
        ui.MessagePatternView = MessagePatternView;

        var MessageEditorView = (function (_super) {
            __extends(MessageEditorView, _super);
            function MessageEditorView() {
                _super.call(this, null);

                this.selected = true;
                this.elem.classList.add('chosen');
                this.elem.classList.add('normal');
            }
            MessageEditorView.prototype.setModel = function (model) {
                _super.prototype.setModel.call(this, model);
                this.trigger({
                    type: 'change:content',
                    elem: this.getCachedFullElem()
                });
            };

            MessageEditorView.prototype.on = function (type, callback, context) {
                _super.prototype.on.call(this, type, callback, context);
            };

            MessageEditorView.prototype.once = function (type, callback, context) {
                _super.prototype.once.call(this, type, callback, context);
            };
            return MessageEditorView;
        })(MessageView);
        ui.MessageEditorView = MessageEditorView;
    })(messenger.ui || (messenger.ui = {}));
    var ui = messenger.ui;
})(messenger || (messenger = {}));
