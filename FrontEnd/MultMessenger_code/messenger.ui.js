/// <reference path="deep.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    (function (ui) {
        var ControlView = (function (_super) {
            __extends(ControlView, _super);
            function ControlView() {
                _super.apply(this, arguments);
            }
            ControlView.prototype.show = function () {
                this.elem.classList.remove('hidden');
            };

            ControlView.prototype.hide = function () {
                this.elem.classList.add('hidden');
            };
            return ControlView;
        })(deep.View);
        ui.ControlView = ControlView;

        var DialogView = (function (_super) {
            __extends(DialogView, _super);
            function DialogView(dialogElementId) {
                _super.call(this);

                this.elem = document.getElementById('dialog-background');
                this.dialogWindowElem = document.getElementById(dialogElementId);
            }
            DialogView.prototype.show = function () {
                this.elem.classList.remove('hidden');
                this.showDialogWindowElem();
            };

            DialogView.prototype.hide = function () {
                this.elem.classList.add('hidden');
                this.hideDialogWindowElem();
            };

            DialogView.prototype.showDialogWindowElem = function () {
                this.dialogWindowElem.classList.remove('hidden');
            };

            DialogView.prototype.hideDialogWindowElem = function () {
                this.dialogWindowElem.classList.add('hidden');
            };
            return DialogView;
        })(deep.View);
        ui.DialogView = DialogView;
    })(messenger.ui || (messenger.ui = {}));
    var ui = messenger.ui;
})(messenger || (messenger = {}));
//# sourceMappingURL=messenger.ui.js.map
