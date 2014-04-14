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
                this.scrape = function () {
                    this.socket.send('scrape');
                };
                this.store = function (tag, id, data) {
                    var chunks = [];
                    if (tag)
                        chunks.push(tag);
                    if (id)
                        chunks.push(id);
                    var tagId = chunks.join('.');

                    this.socket.send('store');
                    this.socket.send(tagId);
                    this.socket.send(data);
                };
                this.broadcast = function (tag, id, toUserId, contactMode) {
                    var tagIdArray = [tag, id];
                    var contactModeIdArray = [toUserId];

                    if (contactMode) {
                        contactModeIdArray.splice(0, 0, contactMode);
                    }

                    var tagId = tagIdArray.join('.');
                    var contactModeId = contactModeIdArray.join('.');

                    this.socket.send('broadcast');
                    this.socket.send(tagId);
                    this.socket.send(contactModeId);
                };
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
                    socket.removeEventListener('open', openSocketListener);
                    socket.removeEventListener('close', closeSocketListener);
                    socket.removeEventListener('message', messageSocketListener);
                    socket.removeEventListener('error', errorSocketListener);
                    self.trigger({
                        type: 'disconnect',
                        target: self,
                        socketEvent: e
                    });
                }
                function messageSocketListener(e) {
                    var result = self.parseSocketMessage(e);
                    if (result.isValid) {
                        var response = result.response;
                        var type = self.getResponseType(response);
                        self.trigger({
                            type: type,
                            target: self,
                            response: response,
                            socketEvent: e
                        });
                    } else {
                        self.trigger({
                            type: 'error:message',
                            target: self,
                            socketEvent: e,
                            exception: result.exception
                        });
                    }
                }
                function errorSocketListener(e) {
                    self.trigger({
                        type: 'error',
                        target: self,
                        socketEvent: e
                    });
                }

                this.socket.addEventListener('connect', openSocketListener);
                this.socket.addEventListener('close', closeSocketListener);
                this.socket.addEventListener('message', messageSocketListener);
                this.socket.addEventListener('error', errorSocketListener);
            };

            ChatClient.prototype.disconnect = function () {
                this.socket.close();
            };

            ChatClient.prototype.getResponseType = function (response) {
                var type = 'message:unknown';

                if (response.login) {
                    type = 'message:login';
                } else if (response.scrape) {
                    type = 'message:scrape';
                } else if (response.retrieve) {
                    type = 'message:retrieve';
                } else if (response.broadcast) {
                    type = 'message:broadcast';
                } else if (response.users) {
                    type = 'message:users';
                } else if (response.perlbox) {
                    type = 'message:perlbox';
                } else if (response.notify) {
                    type = 'message:notify';
                } else if (response.send) {
                    type = 'message:send';
                } else if (response.sent) {
                    type = 'message:sent';
                } else if (response.tape) {
                    type = 'message:tape';
                } else if (response.online) {
                    type = 'message:online';
                } else if (response.status) {
                    type = 'message:status';
                } else if (response.broadcast) {
                    type = 'message:broadcast';
                } else if (response.now) {
                    type = 'message:now';
                } else if (response.subscribelist) {
                    type = 'message:subscribelist';
                } else if (response.toolrepo) {
                    type = 'message:toolrepo';
                } else if (response.groupuserlist) {
                    type = 'message:groupuserlist';
                } else if (response.publiclist) {
                    type = 'message:publiclist';
                } else if (response.ignore) {
                    type = 'message:ignore';
                } else if (response.grouptape) {
                    type = 'message:grouptape';
                } else if (response.messagedump) {
                    type = 'message:messagedump';
                } else {
                    console.log(response);
                }

                return type;
            };
            ChatClient.prototype.parseSocketMessage = function (socketEvent) {
                var result = {
                    isValid: false,
                    response: null,
                    exception: null
                };

                try  {
                    var data = socketEvent.data;
                    result.response = JSON.parse(data);
                    result.isValid = true;
                } catch (e) {
                    result.exception = e;
                }

                return result;
            };

            //basic protocol operations
            ChatClient.prototype.login = function (userId) {
                this.socket.send('login');
                this.socket.send(userId);
            };

            ChatClient.prototype.retrieve = function (idsString) {
                this.socket.send('retrieve');
                this.socket.send(idsString);
            };
            ChatClient.prototype.users = function () {
                this.socket.send('users');
            };
            ChatClient.prototype.tape = function () {
                this.socket.send('tape');
            };
            ChatClient.prototype.cleartape = function () {
                this.socket.send('cleartape');
            };
            ChatClient.prototype.shown = function (idsString) {
                this.socket.send('shown');
                this.socket.send(idsString);
            };
            ChatClient.prototype.addperl = function (id) {
                this.socket.send('addperl');
                this.socket.send(['msg', id].join('.'));
            };
            ChatClient.prototype.removeperl = function (id) {
                this.socket.send('removeperl');
                this.socket.send(['msg', id].join('.'));
            };
            ChatClient.prototype.perlbox = function (userId) {
                this.socket.send('perlbox');
                this.socket.send(userId);
            };
            ChatClient.prototype.online = function () {
                this.socket.send('online');
            };
            ChatClient.prototype.status = function (contactId) {
                this.socket.send('status');
                this.socket.send(contactId);
            };
            ChatClient.prototype.notify = function (tag, id, toUserId, contactMode) {
                var tagIdArray = [tag, id];
                var contactModeIdArray = [toUserId];

                if (contactMode) {
                    contactModeIdArray.splice(0, 0, contactMode);
                }

                var tagId = tagIdArray.join('.');
                var contactModeId = contactModeIdArray.join('.');

                this.socket.send('notify');
                this.socket.send(tagId);
                this.socket.send(contactModeId);
            };

            ChatClient.prototype.send = function (tag, id, toUserId, contactMode) {
                var tagIdArray = [tag, id];
                var contactModeIdArray = [toUserId];

                if (contactMode) {
                    contactModeIdArray.splice(0, 0, contactMode);
                }

                var tagId = tagIdArray.join('.');
                var contactModeId = contactModeIdArray.join('.');

                this.socket.send('send');
                this.socket.send(tagId);
                this.socket.send(contactModeId);
            };
            ChatClient.prototype.now = function () {
                this.socket.send('now');
            };
            ChatClient.prototype.subscribelist = function () {
                this.socket.send('subscribelist');
            };
            ChatClient.prototype.subscribe = function (groupId, userId) {
                this.socket.send('subscribe');
                this.socket.send(groupId);
                this.socket.send(userId);
            };
            ChatClient.prototype.unsubscribe = function (groupId, userId) {
                this.socket.send('unsubscribe');
                this.socket.send(groupId);
                this.socket.send(userId);
            };
            ChatClient.prototype.toolrepo = function () {
                this.socket.send('toolrepo');
            };
            ChatClient.prototype.addtool = function (toolId) {
                this.socket.send('addtool');
                this.socket.send(['tool', toolId].join('.'));
            };
            ChatClient.prototype.removetool = function (toolId) {
                this.socket.send('removetool');
                this.socket.send(['tool', toolId].join('.'));
            };
            ChatClient.prototype.groupuserlist = function (groupId) {
                this.socket.send('groupuserlist');
                this.socket.send(groupId);
            };
            ChatClient.prototype.createpublic = function (id) {
                this.socket.send('createpublic');
                this.socket.send(['public', id].join('.'));
            };
            ChatClient.prototype.createtheme = function (id) {
                this.socket.send('createtheme');
                this.socket.send(['theme', id].join('.'));
            };
            ChatClient.prototype.publiclist = function () {
                this.socket.send('publiclist');
            };
            ChatClient.prototype.remove = function (idsString) {
                this.socket.send('delete');
                this.socket.send(idsString);
            };
            ChatClient.prototype.ignore = function (id) {
                this.socket.send('ignore');
                this.socket.send(id);
            };
            ChatClient.prototype.grouptape = function (id, count, offset) {
                this.socket.send('grouptape');
                this.socket.send(id);
                this.socket.send([count, offset].join('/'));
            };
            ChatClient.prototype.messagedump = function (startTimestamp, endTimestamp) {
                this.socket.send('messagedump');
                this.socket.send([startTimestamp, endTimestamp].join('-'));
            };

            //complex protocol operations
            ChatClient.prototype.sendMessage = function (message, contactMode) {
                var tag = 'msg';
                var data = JSON.stringify(message);

                this.store(tag, message.id, data);
                this.send(tag, message.id, message.group || message.to, contactMode);
            };
            ChatClient.prototype.notifyMessage = function (message, contactMode, ignoreStore) {
                var tag = 'msg';
                var data = JSON.stringify(message);

                if (!ignoreStore) {
                    this.store(tag, message.id, data);
                }
                this.notify(tag, message.id, message.group || message.to, contactMode);
            };
            ChatClient.prototype.broadcastMessage = function (message, contactMode, ignoreStore) {
                var tag = 'msg';
                var data = JSON.stringify(message);

                if (!ignoreStore) {
                    this.store(tag, message.id, data);
                }
                this.broadcast(tag, message.id, message.group || message.to, contactMode);
            };
            ChatClient.prototype.saveTool = function (tool) {
                var data = JSON.stringify(tool);
                this.store('tool', tool.id, data);
                this.addtool(tool.id);
            };
            ChatClient.prototype.deleteTool = function (toolId) {
                this.removetool(toolId);
            };
            return ChatClient;
        })(deep.EventEmitter);
        chat.ChatClient = ChatClient;

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
