var chat = chat || {};

(function(chat, base64) {
	
	var EventEmitter = function() {
		this.listeners = {};
		
		this.on = this.addEventListener = function(type, listener) {
			this.listeners[type] = this.listeners[type] || [];
			this.listeners[type].push(listener);
		};
		this.off = this.removeEventListener = function(type, listener) {
			if (this.listeners[type] instanceof Array) {
				var index = this.listener[type].indexOf(listener);
				if (index !== -1) {
					this.listeners[type].splice(index, 1);
				}
			}
		};
		this.trigger = this.fire = function(event) {
			if (typeof(event) === typeof('')) {
				event = { type: event };
			}
			if (!event.target) {
				event.target = this;
			}
			if (this.listeners[event.type] instanceof Array) {
				var self = this;
				var typeListeners = this.listeners[event.type];
				typeListeners.forEach(function(listener) {
					listener.call(self, event);	
				});
			}
		};
	};
	
	var ChatClient = function(serverUrl) {
		this.connect = function() {
			this._socket = new WebSocket(this._serverUrl);
			
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
				self._socket.removeEventListener('open', openSocketListener);
				self._socket.removeEventListener('close', closeSocketListener);
				self._socket.removeEventListener('message', messageSocketListener);
				self._socket.removeEventListener('error', errorSocketListener);
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
			
			this._socket.addEventListener('open', openSocketListener);
			this._socket.addEventListener('close', closeSocketListener);
			this._socket.addEventListener('message', messageSocketListener);
			this._socket.addEventListener('error', errorSocketListener);
		};
		
		//basic protocol operations
		this.login = function(userId) {
			this._socket.send('login');
			this._socket.send(userId);
		};
		this.scrape = function() {
			this._socket.send('scrape');	
		};
		this.store = function(tag, id, data) {
			var tagId = [tag, id].join('.');
			
			this._socket.send('store');
			this._socket.send(tagId);
			this._socket.send(data);
		};
		this.retrieve = function(idsString) {
			this._socket.send('retrieve');
			this._socket.send(idsString);
		};
		this.broadcast = function(fullDocumentId) {
			this._socket.send('broadcast');
			this._socket.send(fullDocumentId);
		};
		this.users = function() {
			this._socket.send('users');	
		};
		this.tape = function() {
			this._socket.send('tape');
		};
		this.online = function() {
			this._socket.send('online');
		};
		this.status = function(contactId) {
			this._socket.send('status');
			this._socket.send(contactId);
		};
		this.notify = function(tag, id, data, toUserId, contactMode) {
			var tagIdArray = [tag, id];
			var contactModeIdArray = [toUserId];
			
			if (contactMode) {
				contactModeIdArray.splice(0, 0, contactMode);
			}
			
			var tagId = tagIdArray.join('.');
			var contactModeId = contactModeIdArray.join('.');
			
			this._socket.send('notify');
			this._socket.send(tagId);
			this._socket.send(contactModeId);
		};
		this.send = function(tag, id, data, toUserId, contactMode) {
			var tagIdArray = [tag, id];
			var contactModeIdArray = [toUserId];
			
			if (contactMode) {
				contactModeIdArray.splice(0, 0, contactMode);
			}
			
			var tagId = tagIdArray.join('.');
			var contactModeId = contactModeIdArray.join('.');
			
			this._socket.send('send');
			this._socket.send(tagId);
			this._socket.send(contactModeId);
		};
		this.now = function() {
			this._socket.send('now');	
		};
		this.subscribelist = function() {
			this._socket.send('subscribelist');	
		};
		this.subscribe = function(groupId, userId) {
			this._socket.send('subscribe');
			this._socket.send(groupId);
			this._socket.send(userId);
		};
		this.unsubscribe = function(groupId, userId) {
			this._socket.send('unsubscribe');
			this._socket.send(groupId);
			this._socket.send(userId);
		};
		this.toolrepo = function() {
			this._socket.send('toolrepo');	
		};
		this.addtool = function(toolId) {
			this._socket.send('addtool');
			this._socket.send(['tool', toolId].join('.'));
		};
		this.removetool = function(toolId) {
			this._socket.send('removetool');
			this._socket.send(['tool', toolId].join('.'));
		};
		this.groupuserlist = function(groupId) {
			this._socket.send('groupuserlist');	
			this._socket.send(groupId);
		};
		this.publiclist = function() {
			this._socket.send('publiclist');	
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
		
		this._parseSocketMessage = function(socketEvent) {
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
		this._getResponseType = function(response) {
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
		
		this._serverUrl = serverUrl;
		this._socket = null;
		
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