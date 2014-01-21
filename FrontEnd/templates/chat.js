var chat = chat || {};

(function(chat) {
	
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

		EventEmitter.call(this);
		
		this._serverUrl = serverUrl;
		this._socket = null;
		
		this.connect = function(userId) {
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
		
		this.login = function(userId) {
			this._socket.send('login');
			this._socket.send(userId);
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
		}
		
		this.send = function(tag, id, data, toUserId, contactMode) {
			var tagIdArray = [tag, id];
			var contactModeIdArray = [toUserId];
			
			if (contactMode) {
				contactModeIdArray.splice(0, 0, contactMode);
			}
			
			var tagId = tagIdArray.join('.');
			var contactModeId = contactModeIdArray.join('.');
			console.log(tagId);
			console.log(contactModeId);
			
			this.store(tag, id, data);
			this._socket.send('send');
			this._socket.send(tagId);;
			this._socket.send(contactModeId);
		};
		this.store = function(tag, id, data) {
			var tagId = [tag, id].join('.');
			
			this._socket.send('store');
			this._socket.send(tagId);
			this._socket.send(data);
		};
		this.sendMessage = function(messageId, messageString, toUserId, contactMode) {
			this.send('msg', messageId, messageString, toUserId, contactMode);	
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
			} else if (response.users) {
				type = 'message:users';
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
			}
			
			return type;
		};
	};
	
	chat.EventEmitter = EventEmitter;
	chat.ChatClient = ChatClient;
	
})(chat);






