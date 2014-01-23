var chat = chat || {};

(function(chat, base64) {
	
	var EventEmitter = function() {
		var self = this;
		self.listeners = {};
		
		self.on = this.addEventListener = function(type, listener) {
			self.listeners[type] = self.listeners[type] || [];
			self.listeners[type].push(listener);
		};
		self.off = this.removeEventListener = function(type, listener) {
			if (!type) {
				self.listeners = {};
			}
			else if (self.listeners[type] instanceof Array) {
				if (listener) {
					var index = self.listeners[type].indexOf(listener);
					if (index !== -1) {
					self.listeners[type].splice(index, 1);
				}
				} else {
					self.listeners[type] = [];
				}
			}
		};
		self.trigger = this.fire = function(event) {
			if (typeof(event) === typeof('')) {
				event = { type: event };
			}
			if (!event.target) {
				event.target = self;
			}
			if (self.listeners[event.type] instanceof Array) {
				var typeListeners = self.listeners[event.type];
				typeListeners.forEach(function(listener) {
					listener.call(self, event);	
				});
			}
		};
	};
	
	var ChatClient = function(serverUrl) {
		this.connect = function() {
			_socket = new WebSocket(_serverUrl);
			
			var self = this;
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
				var result = _parseSocketMessage(socketEvent);
				if (result.isValid) {
					var response = result.response;
					var type = _getResponseType(response);
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
			
			_socket.addEventListener('open', openSocketListener);
			_socket.addEventListener('close', closeSocketListener);
			_socket.addEventListener('message', messageSocketListener);
			_socket.addEventListener('error', errorSocketListener);
		};
		this.disconnect = function() {
			_socket.close();
			_socket = null;
		};
		
		//basic protocol operations
		this.login = function(userId) {
			_socket.send('login');
			_socket.send(userId);
		};
		this.scrape = function() {
			_socket.send('scrape');	
		};
		this.store = function(tag, id, data) {
			var tagId = [tag, id].join('.');
			
			_socket.send('store');
			_socket.send(tagId);
			_socket.send(data);
		};
		this.retrieve = function(idsString) {
			_socket.send('retrieve');
			_socket.send(idsString);
		};
		this.broadcast = function(fullDocumentId) {
			_socket.send('broadcast');
			_socket.send(fullDocumentId);
		};
		this.users = function() {
			_socket.send('users');	
		};
		this.tape = function() {
			_socket.send('tape');
		};
		this.cleartape = function() {
			this._scoket.send('cleartape');
		};
		this.shown = function(idsString) {
			_socket.send('shown');
			_socket.send(idsString);
		};
		this.addperl = function(id) {
			_socket.send('addperl');
			_socket.send(['msg', id].join('.'));
		};
		this.removeperl = function(id) {
			_socket.send('removeperl');
			_socket.send(['msg', id].join('.'));
		};
		this.perlbox = function(userId) {
			_socket.send('perlbox');
			_socket.send(userId);
		};
		this.online = function() {
			_socket.send('online');
		};
		this.status = function(contactId) {
			_socket.send('status');
			_socket.send(contactId);
		};
		this.notify = function(tag, id, data, toUserId, contactMode) {
			var tagIdArray = [tag, id];
			var contactModeIdArray = [toUserId];
			
			if (contactMode) {
				contactModeIdArray.splice(0, 0, contactMode);
			}
			
			var tagId = tagIdArray.join('.');
			var contactModeId = contactModeIdArray.join('.');
			
			_socket.send('notify');
			_socket.send(tagId);
			_socket.send(contactModeId);
		};
		this.send = function(tag, id, data, toUserId, contactMode) {
			var tagIdArray = [tag, id];
			var contactModeIdArray = [toUserId];
			
			if (contactMode) {
				contactModeIdArray.splice(0, 0, contactMode);
			}
			
			var tagId = tagIdArray.join('.');
			var contactModeId = contactModeIdArray.join('.');
			
			_socket.send('send');
			_socket.send(tagId);
			_socket.send(contactModeId);
		};
		this.now = function() {
			_socket.send('now');	
		};
		this.subscribelist = function() {
			_socket.send('subscribelist');	
		};
		this.subscribe = function(groupId, userId) {
			_socket.send('subscribe');
			_socket.send(groupId);
			_socket.send(userId);
		};
		this.unsubscribe = function(groupId, userId) {
			_socket.send('unsubscribe');
			_socket.send(groupId);
			_socket.send(userId);
		};
		this.toolrepo = function() {
			_socket.send('toolrepo');	
		};
		this.addtool = function(toolId) {
			_socket.send('addtool');
			_socket.send(['tool', toolId].join('.'));
		};
		this.removetool = function(toolId) {
			_socket.send('removetool');
			_socket.send(['tool', toolId].join('.'));
		};
		this.groupuserlist = function(groupId) {
			_socket.send('groupuserlist');	
			_socket.send(groupId);
		};
		this.createpublic = function(id) {
			_socket.send('createpublic');
			_socket.send(['public', id].join('.'));
		};
		this.createtheme = function(id) {
			_socket.send('createtheme');
			_socket.send(['theme', id].join('.'));
		};
		this.publiclist = function() {
			_socket.send('publiclist');	
		};
		
		//complex protocol operations
		this.sendMessage = function(message, contactMode) {
			var tag = 'msg';
			var data = JSON.stringify(message);
			
			this.store(tag, message.id, data);
			this.send(tag, message.id, data, message.to, contactMode);	
		};
		this.notifyMessage = function(message, contactMode) {
			var tag = 'msg';
			var data = JSON.stringify(message);
			
			this.store(tag, message.id, data);
			this.notify(tag, message.id, data, message.to, contactMode);	
		};
		this.saveTool = function(tool) {
			var data = JSON.stringify(tool);
			this.store('tool', tool.id, data);
			this.addtool(tool.id);
		};
		this.deleteTool = function(toolId) {
			this.removetool(toolId);
		};
		
		var _parseSocketMessage = function(socketEvent) {
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
		var _getResponseType = function(response) {
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
			}
			
			return type;
		};
		
		var _serverUrl = serverUrl;
		var _socket = null;
		
		EventEmitter.call(this);
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
	
	chat.EventEmitter = EventEmitter;
	chat.ChatClient = ChatClient;
	chat.MessageFactory = MessageFactory;
	chat.ToolFactory = ToolFactory;
	
})(chat, base64);