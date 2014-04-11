var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var deep;
(function (deep) {
    'use strict';

    var EventEmitter = (function () {
        function EventEmitter() {
            this.listeners = {};
        }
        EventEmitter.prototype.on = function (type, callback, context) {
            this.listeners[type] = this.listeners[type] || [];
            this.listeners[type].push({
                callback: callback,
                context: context || this
            });
        };

        EventEmitter.prototype.once = function (type, callback, context) {
            this.listeners[type] = this.listeners[type] || [];
            this.listeners[type].push({
                callback: callback,
                context: context || this,
                once: true
            });
        };

        EventEmitter.prototype.off = function (type, callback, context) {
            if (!type) {
                this.listeners = {};
            } else if (!!this.listeners[type]) {
                if (callback) {
                    this.listeners[type] = this.listeners[type].filter(function (listener) {
                        var sameCallbacks = listener.callback === callback;
                        var sameContexts = context ? listener.context === context : true;
                        return !(sameCallbacks && sameContexts);
                    });
                } else {
                    this.listeners[type] = [];
                }
            }
        };

        EventEmitter.prototype.trigger = function (event) {
            if (typeof event === 'string') {
                event = { type: event };
            }
            if (!event.target) {
                event.target = this;
            }
            if (this.listeners[event.type]) {
                var hasExpiredListeners = false;
                this.listeners[event.type].forEach(function (listener) {
                    listener.callback.call(listener.context, event);
                    hasExpiredListeners = listener.once || hasExpiredListeners;
                });
                if (hasExpiredListeners) {
                    this.listeners[event.type] = this.listeners[event.type].filter(function (listener) {
                        return !listener.once;
                    });
                }
            }
        };
        return EventEmitter;
    })();
    deep.EventEmitter = EventEmitter;

    var Model = (function (_super) {
        __extends(Model, _super);
        function Model() {
            _super.call(this);
            this.attributes = {};
            this.disposed = false;
        }
        Model.prototype.set = function () {
            var _this = this;
            var attributes;
            var options;

            if (typeof (arguments[0]) === 'object') {
                attributes = arguments[0];
                options = arguments[1];
            } else {
                attributes = {};
                attributes[arguments[0]] = arguments[1];
                options = arguments[2];
            }

            options || (options = {});
            var target = options.target || this;
            var silent = options.silent;

            Object.keys(attributes).forEach(function (key) {
                _this.attributes[key] = attributes[key];
                if (!silent) {
                    _this.trigger({
                        type: 'set:' + key,
                        target: target,
                        value: attributes[key]
                    });
                }
            });

            if (!silent) {
                this.trigger({
                    type: 'set',
                    target: target,
                    attributes: attributes
                });
            }
        };

        Model.prototype.unset = function (key, options) {
            options || (options = {});
            var target = options.target || this;
            var silent = options.silent;

            if (this.has(key)) {
                delete this.attributes[key];
                if (!silent) {
                    this.trigger({
                        type: 'unset',
                        target: target,
                        key: key
                    });
                    this.trigger({
                        type: 'unset:' + key,
                        target: target
                    });
                }
            }
        };

        Model.prototype.get = function (key) {
            return this.attributes[key];
        };

        Model.prototype.has = function (key) {
            return this.attributes.hasOwnProperty(key);
        };

        Model.prototype.toJSON = function () {
            return this.attributes;
        };

        Model.prototype.dispose = function () {
            if (!this.disposed) {
                this.disposed = true;
                this.trigger('dispose');
                this.off();
            }
        };
        return Model;
    })(EventEmitter);
    deep.Model = Model;

    var View = (function (_super) {
        __extends(View, _super);
        function View() {
            _super.call(this);
            this.initialize();
        }
        View.prototype.initialize = function () {
        };

        View.prototype.getRootElem = function () {
            return this.elem;
        };

        View.prototype.getParentElem = function () {
            return this.parentElem;
        };
        return View;
    })(EventEmitter);
    deep.View = View;
})(deep || (deep = {}));
//# sourceMappingURL=deep.js.map
