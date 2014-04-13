/// <reference path="deep.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
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
    })(messenger.misc || (messenger.misc = {}));
    var misc = messenger.misc;
})(messenger || (messenger = {}));
