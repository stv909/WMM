/// <reference path="base64.d.ts" />
/// <reference path="deep.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var messenger;
(function (messenger) {
    (function (chat) {
        var ChatClient = (function (_super) {
            __extends(ChatClient, _super);
            function ChatClient(serverUrl) {
                _super.call(this);
                this.serverUrl = serverUrl;
            }
            ChatClient.prototype.connect = function () {
                var self = this;
                this.socket = new WebSocket(this.serverUrl);

                function openSocketListener(e) {
                    self.trigger({
                        type: 'connect',
                        target: self,
                        socketEvent: e
                    });
                }
                function closeSocketListener(e) {
                    var socket = e.srcElement;
                    self.trigger({
                        type: 'disconnect',
                        target: self,
                        socketEvent: e
                    });
                }
                function messageSocketListener(e) {
                }
                function errorSocketListener(e) {
                }

                this.socket.addEventListener('connect', openSocketListener);
                this.socket.addEventListener('close', closeSocketListener);
                this.socket.addEventListener('message', messageSocketListener);
                this.socket.addEventListener('error', errorSocketListener);
            };
            return ChatClient;
        })(deep.EventEmitter);
        chat.ChatClient = ChatClient;

        var chatClient = new ChatClient('test');
        chatClient.on('connect', function (e) {
        });

        var MessageFactory = (function () {
            function MessageFactory() {
            }
            MessageFactory.encode = function (message) {
                message.content = base64.encode(message.content);
                return message;
            };
            MessageFactory.decode = function (message) {
                message.content = base64.decode(message.content);
                return message;
            };
            return MessageFactory;
        })();
        chat.MessageFactory = MessageFactory;

        var ToolFactory = (function () {
            function ToolFactory() {
            }
            ToolFactory.encode = function (tool) {
                tool.content = base64.encode(tool.content);
                return tool;
            };
            ToolFactory.decode = function (tool) {
                tool.content = base64.decode(tool.content);
                return tool;
            };
            return ToolFactory;
        })();
        chat.ToolFactory = ToolFactory;
    })(messenger.chat || (messenger.chat = {}));
    var chat = messenger.chat;
})(messenger || (messenger = {}));
//# sourceMappingURL=messenger.chat.js.map
