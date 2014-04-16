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
            function MessageView(model, min) {
                _super.call(this);
                this.selected = false;

                this.model = model;
                this.elem = eye.template({
                    templateId: 'message-template',
                    className: 'message'
                });
                this.contentElem = this.elem.getElementsByClassName('content')[0];
                this.dataElem = this.contentElem.getElementsByClassName('data')[0];
                if (min) {
                    this.elem.classList.add('min');
                }
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
                this.dataElem.appendChild(this.cachedElem);
            };

            MessageView.prototype.removeCachedElem = function () {
                if (this.cachedElem) {
                    this.dataElem.removeChild(this.cachedElem);
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
            function MessagePatternView(model, min) {
                var _this = this;
                _super.call(this, model, min);

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
                this.elem.classList.remove('normal');
            }
            MessageEditorView.prototype.setModel = function (model) {
                _super.prototype.setModel.call(this, model, true);
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

        var ContactView = (function (_super) {
            __extends(ContactView, _super);
            function ContactView() {
                var _this = this;
                _super.call(this);

                this.elem = eye.template({
                    templateId: 'contact-template',
                    className: 'contact'
                });
                this.photoElem = this.elem.getElementsByClassName('photo')[0];
                this.nameElem = this.elem.getElementsByClassName('name')[0];
                this.unreadElem = this.elem.getElementsByClassName('unread')[0];
                this.statusElem = this.elem.getElementsByClassName('status')[0];

                var elemClickListener = function () {
                    _this.trigger('select-force');
                    if (!_this.selected) {
                        _this.select();
                    }
                };

                this.elem.addEventListener('click', elemClickListener);
                this.once('dispose', function () {
                    _this.elem.removeEventListener('click', elemClickListener);
                });
            }
            ContactView.prototype.select = function (options) {
                this.selected = true;
                this.elem.classList.remove('normal');
                this.elem.classList.add('chosen');
                this.trigger({
                    type: 'select',
                    options: options
                });
            };

            ContactView.prototype.deselect = function () {
                this.selected = false;
                this.elem.classList.add('normal');
                this.elem.classList.remove('chosen');
                this.trigger('deselect');
            };

            ContactView.prototype.disableUnreadCounter = function () {
                this.unreadElem.classList.add('super-hidden');
            };

            ContactView.prototype.disableSelecting = function () {
                this.selected = true;
                this.elem.style.cursor = 'default';
            };

            ContactView.prototype.disablePhoto = function () {
                this.photoElem.classList.add('hidden');
            };
            return ContactView;
        })(ui.ControlView);
        ui.ContactView = ContactView;

        var UserView = (function (_super) {
            __extends(UserView, _super);
            function UserView(user, isChatUser) {
                var _this = this;
                _super.call(this);

                this.isChatUser = isChatUser;
                this.setModel(user);
                this.deselect();
                this.analyticCallback = function () {
                    analytics.send('friends', 'friend_select');
                };

                var nameElemClickListener = function () {
                    var id = _this.model.get('id');
                    var vkLink = [messenger.Settings.vkContactBaseUrl, id].join('');
                    window.open(vkLink, '_blank');
                };
                var elemClickListener = function () {
                    _this.analyticCallback();
                };

                this.nameElem.addEventListener('click', nameElemClickListener);
                this.elem.addEventListener('click', elemClickListener);

                this.once('dispose', function () {
                    _this.nameElem.removeEventListener('click', nameElemClickListener);
                    _this.elem.removeEventListener('click', elemClickListener);
                });
            }
            UserView.prototype.setModel = function (user) {
                var _this = this;
                this.model = user;
                if (!this.model) {
                    return;
                }

                if (this.isChatUser) {
                    var updateUnreadElem = function (unread) {
                        if (unread > 0) {
                            _this.unreadElem.textContent = ['+', unread].join('');
                            _this.unreadElem.classList.remove('hidden');
                        } else {
                            _this.unreadElem.classList.add('hidden');
                        }
                    };
                    var updateOnlineStatus = function (online) {
                        if (online) {
                            _this.statusElem.classList.remove('offline');
                        } else {
                            _this.statusElem.classList.add('offline');
                        }
                    };
                    var updateIsAppUser = function (isAppUser) {
                        if (isAppUser) {
                            _this.elem.classList.add('app');
                        } else {
                            _this.elem.classList.remove('app');
                        }
                    };

                    this.model.on('set:unread', function (e) {
                        updateUnreadElem(e.value);
                    });
                    this.model.on('set:online', function (e) {
                        updateOnlineStatus(e.value);
                    });
                    this.model.on('set:isAppUser', function (e) {
                        updateIsAppUser(e.value);
                    });

                    updateUnreadElem(this.model.get('unread'));
                    updateOnlineStatus(this.model.get('online'));
                    updateIsAppUser(this.model.get('isAppUser'));
                }

                if (this.model.get('canPost')) {
                    this.elem.classList.remove('closed');
                } else {
                    this.elem.classList.add('closed');
                }

                this.photoElem.src = this.model.get('photo');
                this.nameElem.textContent = this.model.getFullName();
            };

            UserView.prototype.setAnalytic = function (analyticCallback) {
                this.analyticCallback = analyticCallback;
            };
            return UserView;
        })(ContactView);
        ui.UserView = UserView;

        var GroupView = (function (_super) {
            __extends(GroupView, _super);
            function GroupView(group) {
                var _this = this;
                _super.call(this);

                this.setModel(group);
                this.deselect();

                var nameElemClickListener = function () {
                    var id = -_this.model.get('id');
                    var type = _this.model.get('type');
                    var vkLink = [messenger.Settings.vkGroupBaseUrls[type], id].join('');
                    window.open(vkLink, '_blank');
                };
                var elemClickListener = function () {
                    analytics.send('friends', 'group_select');
                };

                this.nameElem.addEventListener('click', nameElemClickListener);
                this.elem.addEventListener('click', elemClickListener);

                this.once('dispose', function () {
                    _this.nameElem.removeEventListener('click', nameElemClickListener);
                    _this.elem.removeEventListener('click', elemClickListener);
                });
            }
            GroupView.prototype.setModel = function (group) {
                this.model = group;
                if (!this.model) {
                    return;
                }

                this.photoElem.src = this.model.get('photo');
                this.nameElem.textContent = this.model.get('name');
            };
            return GroupView;
        })(ContactView);
        ui.GroupView = GroupView;
    })(messenger.ui || (messenger.ui = {}));
    var ui = messenger.ui;
})(messenger || (messenger = {}));
