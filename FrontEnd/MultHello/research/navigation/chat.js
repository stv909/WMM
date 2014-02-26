var chat = chat || {};

(function(chat, eve, base64) {

	var EventEmitter = eve.EventEmitter;

	var ChatClient = function(serverUrl) {
		ChatClient.super.apply(this);
		this.serverUrl = serverUrl;
		this.socket = null;
	};
	ChatClient.super = EventEmitter;
	ChatClient.prototype = Object.create(EventEmitter.prototype);
	ChatClient.prototype.constructor = ChatClient;
	ChatClient.prototype.connect = function() {
		var self = this;
		this.socket = new WebSocket(this.serverUrl);

		var openSocketListener = function(socketEvent) {
			self.trigger({
				type: 'connect',
				target: self,
				socketEvent: socketEvent
			});
		};
		var closeSocketListener = function(socketEvent) {
			self.trigger({
				type: 'disconnect',
				target: self,
				socketEvent: socketEvent
			});
			var socket = socketEvent.srcElement;
			socket.removeEventListener('open', openSocketListener);
			socket.removeEventListener('close', closeSocketListener);
			socket.removeEventListener('message', messageSocketListener);
			socket.removeEventListener('error', errorSocketListener);
		};
		var messageSocketListener = function(socketEvent) {
			var result = self._parseSocketMessage(socketEvent);
			if (result.isValid) {
				var response = result.response;
				var type = self._getResponseType(response);
				self.trigger({
					type: type,
					target: self,
					response: response,
					socketEvent: socketEvent
				});
			} else {
				self.trigger({
					type: 'error:message',
					target: self,
					socketEvent: socketEvent,
					exception: result.exception
				});
			}
		};
		var errorSocketListener = function(socketEvent) {
			self.trigger({
				type: 'error:socket',
				target: self,
				socketEvent: socketEvent
			});
		};

		this.socket.addEventListener('open', openSocketListener);
		this.socket.addEventListener('close', closeSocketListener);
		this.socket.addEventListener('message', messageSocketListener);
		this.socket.addEventListener('error', errorSocketListener);
	};
	ChatClient.prototype._parseSocketMessage = function(socketEvent) {
		var result = {
			isValid: false,
			response: null,
			exception: null
		};

		try {
			var data = socketEvent.data;
			result.response = JSON.parse(data);
			result.isValid = true;
		} catch(e) {
			result.exception = e;
		}

		return result;
	};
	ChatClient.prototype._getResponseType = function(response) {
		var type = 'message:unknown';

		if (response.login) {
			type = 'message:login';
		} else if(response.scrape) {
			type = 'message:scrape';
		} else if(response.retrieve) {
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
		} else if (response.notify) {
			type ='message:notify';
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
		}

		return type;
	};
	ChatClient.prototype.disconnect = function() {
		this.socket.close();
		this.socket = null;
	};
	//basic protocol operations
	ChatClient.prototype.login = function(userId) {
		this.socket.send('login');
		this.socket.send(userId);
	};
	ChatClient.prototype.scrape = function() {
		this.socket.send('scrape');
	};
	ChatClient.prototype.store = function(tag, id, data) {
		var tagId = [tag, id].join('.');

		this.socket.send('store');
		this.socket.send(tagId);
		this.socket.send(data);
	};
	ChatClient.prototype.retrieve = function(idsString) {
		this.socket.send('retrieve');
		this.socket.send(idsString);
	};
	ChatClient.prototype.broadcast = function(fullDocumentId) {
		this.socket.send('broadcast');
		this.socket.send(fullDocumentId);
	};
	ChatClient.prototype.users = function() {
		this.socket.send('users');
	};
	ChatClient.prototype.tape = function() {
		this.socket.send('tape');
	};
	ChatClient.prototype.cleartape = function() {
		this.socket.send('cleartape');
	};
	ChatClient.prototype.shown = function(idsString) {
		this.socket.send('shown');
		this.socket.send(idsString);
	};
	ChatClient.prototype.addperl = function(id) {
		this.socket.send('addperl');
		this.socket.send(['msg', id].join('.'));
	};
	ChatClient.prototype.removeperl = function(id) {
		this.socket.send('removeperl');
		this.socket.send(['msg', id].join('.'));
	};
	ChatClient.prototype.perlbox = function(userId) {
		this.socket.send('perlbox');
		this.socket.send(userId);
	};
	ChatClient.prototype.online = function() {
		this.socket.send('online');
	};
	ChatClient.prototype.status = function(contactId) {
		this.socket.send('status');
		this.socket.send(contactId);
	};
	ChatClient.prototype.notify = function(tag, id, data, toUserId, contactMode) {
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
	ChatClient.prototype.send = function(tag, id, data, toUserId, contactMode) {
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
	ChatClient.prototype.now = function() {
		this.socket.send('now');
	};
	ChatClient.prototype.subscribelist = function() {
		this.socket.send('subscribelist');
	};
	ChatClient.prototype.subscribe = function(groupId, userId) {
		this.socket.send('subscribe');
		this.socket.send(groupId);
		this.socket.send(userId);
	};
	ChatClient.prototype.unsubscribe = function(groupId, userId) {
		this.socket.send('unsubscribe');
		this.socket.send(groupId);
		this.socket.send(userId);
	};
	ChatClient.prototype.toolrepo = function() {
		this.socket.send('toolrepo');
	};
	ChatClient.prototype.addtool = function(toolId) {
		this.socket.send('addtool');
		this.socket.send(['tool', toolId].join('.'));
	};
	ChatClient.prototype.removetool = function(toolId) {
		this.socket.send('removetool');
		this.socket.send(['tool', toolId].join('.'));
	};
	ChatClient.prototype.groupuserlist = function(groupId) {
		this.socket.send('groupuserlist');
		this.socket.send(groupId);
	};
	ChatClient.prototype.createpublic = function(id) {
		this.socket.send('createpublic');
		this.socket.send(['public', id].join('.'));
	};
	ChatClient.prototype.createtheme = function(id) {
		this.socket.send('createtheme');
		this.socket.send(['theme', id].join('.'));
	};
	ChatClient.prototype.publiclist = function() {
		this.socket.send('publiclist');
	};
	ChatClient.prototype.remove = function(idsString) {
		this.socket.send('delete');
		this.socket.send(idsString);
	};
	ChatClient.prototype.ignore = function(id) {
		this.socket.send('ignore');
		this.socket.send(id);
	};
	//complex protocol operations
	ChatClient.prototype.sendMessage = function(message, contactMode) {
		var tag = 'msg';
		var data = JSON.stringify(message);

		this.store(tag, message.id, data);
		this.send(tag, message.id, data, message.group || message.to, contactMode);
	};
	ChatClient.prototype.notifyMessage = function(message, contactMode, ignoreStore) {
		var tag = 'msg';
		var data = JSON.stringify(message);

		if (!ignoreStore) {
			this.store(tag, message.id, data);
		}
		this.notify(tag, message.id, data, message.group || message.to, contactMode);
	};
	ChatClient.prototype.saveTool = function(tool) {
		var data = JSON.stringify(tool);
		this.store('tool', tool.id, data);
		this.addtool(tool.id);
	};
	ChatClient.prototype.deleteTool = function(toolId) {
		this.removetool(toolId);
	};

	var MessageFactory = function() { };
	MessageFactory.create = function(id, content , fromUserId, toUserId, timestamp) {
		return {
			id: id,
			content: base64.encode(content),
			from: fromUserId,
			to: toUserId,
			timestamp: timestamp
		};
	};

	var ToolFactory = function() { };
	ToolFactory.create = function(id, label, content) {
		return {
			id: id,
			label: label,
			content: base64.encode(content)
		};
	};

	chat.ChatClient = ChatClient;
	chat.MessageFactory = MessageFactory;
	chat.ToolFactory = ToolFactory;

})(chat, eve, base64);