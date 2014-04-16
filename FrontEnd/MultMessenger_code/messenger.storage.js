var messenger = messenger || {};

(function(messenger, eve, Q) {
	
	var EventEmitter = eve.EventEmitter;
	var MessageModel = messenger.data.MessageModel;
	
	var PaginationCollection = function(data) {
		PaginationCollection.super.apply(this);
		
		this.data = data;
		this.count = 4;
		this.offset = 0;
	};
	PaginationCollection.super = EventEmitter;
	PaginationCollection.prototype = Object.create(EventEmitter.prototype);
	PaginationCollection.prototype.constructor = PaginationCollection;
	PaginationCollection.prototype.next = function() {
		var begin = this.offset;
		var end = this.offset + this.count;
		var overflow = end > this.data.length;
		end = overflow ? this.data.length : end;
		
		for (var i = begin; i < end; i++) {
			this.trigger({
				type: 'paginate:item',
				item: this.data[i]
			});
		}
		
		this.offset = end;
		this.isEnd();
	};
	PaginationCollection.prototype.isEnd = function() {
		var isEnd = this.offset >= this.data.length;
		if (isEnd) {
			this.trigger({
				type: 'paginate:end'
			});
		}
	};
	PaginationCollection.prototype.dispose = function() {
		this.off();	
	};
	
	var MessageStorage1 = function(chatClientWrapper) {
		MessageStorage1.super.apply(this);
		var self = this;
		
		this.chatClientWrapper = chatClientWrapper;
		this.chatClient = this.chatClientWrapper.chatClient;
		
		this.publicId = messenger.Settings.publicId;
		//this.publicId = 'public.bc53e8d2-d372-49c2-a91b-2d3b0aaffcb6'; //empty
		
		this.preloadedMessages = {};
		this.messages = {};
		this.currentMessage = null;
		
		this.senderMessageId = null;
		
		this.messageCount = 16;
		this.messageOffset = 0;
		this.totalMessageCount = 0;
		
		this._filterMessageIds = this._filterFirstMessageIds;
		this._addRawMessages = this._addFirstRawMessages;
		
		var messageRecieveListener = function(rawMessage) {
			var value = rawMessage.value || {};
			var group = value.group || "";
			var message = MessageModel.fromRaw(rawMessage);
			var messageId = message.get('id');
			do {
				if (self.hasMessage(messageId)) break;
				if (self.publicId.indexOf(group) === -1) break;
				self.addPreloadedMessage(message);
			} while (false);
		};
		
		this.chatClient.on('message:send', function(event) {
			var message = event.response.send;
			messageRecieveListener(message);
		});
		this.chatClient.on('message:sent', function(event) {
			var message = event.response.sent;
			messageRecieveListener(message);
		});
		this.chatClient.on('message:notify', function(event) {
			var message = event.response.notify;
			message.value = message.body;
			messageRecieveListener(message);
		});
	};
	MessageStorage1.super = EventEmitter;
	MessageStorage1.prototype = Object.create(EventEmitter.prototype);
	MessageStorage1.prototype.constructor = MessageStorage1;
	MessageStorage1.prototype.hasMessage = function(messageId) {
		return this.messages.hasOwnProperty(messageId);	
	};
	MessageStorage1.prototype.addPreloadedMessage = function(message) {
		var messageId = message.get('id');
		if (!this.preloadedMessages.hasOwnProperty(messageId)) {
			this.messageOffset += 1;	
		}
		this.preloadedMessages[messageId] = message;
		this._notifyAboutValidPreloadMessages();
	};
	MessageStorage1.prototype._notifyAboutValidPreloadMessages = function() {
		var self = this;
		var validMessageCount = 0;
		var keys = Object.keys(this.preloadedMessages);
		keys.forEach(function(key) {
			var message = self.preloadedMessages[key];
			if (message.isValid()) {
				validMessageCount++;
			}	
		});
		this.trigger({
			type: 'preload:update',
			count: validMessageCount
		});
	};
	MessageStorage1.prototype.appendPreloadedMessages = function() {
		var self = this;
		var keys = Object.keys(this.preloadedMessages);
		var validKeys = keys.filter(function(key) {
			return self.preloadedMessages[key].isValid();
		});
		validKeys.forEach(function(key) {
			var message = self.preloadedMessages[key];
			self.addMessage(message, true);
			delete self.preloadedMessages[key];
		});
		this.trigger({
			type: 'preload:update',
			count: 0
		});
	};
	MessageStorage1.prototype.addMessage = function(message, first) {
		var messageId = message.get('id');
		if (!this.hasMessage(messageId)) {
			this.messages[messageId] = message;
			this.trigger({
				type: 'add:message',
				message: message,
				first: first
			});
		}
	};
	MessageStorage1.prototype.removeMessage = function(messageId) {
		if (this.hasMessage(messageId)) {
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				messageId: messageId
			});
		}
	};
	MessageStorage1.prototype.selectMessage = function (message) {
		this.currentMessage = message;
		this.trigger({
			type: 'select:message',
			message: this.currentMessage
		});
	};
	MessageStorage1.prototype.setSenderMessageId = function(messageId) {
		this.senderMessageId = messageId;
	};
	MessageStorage1.prototype.getSenderMessageId = function() {
		return this.senderMessageId;	
	};
	MessageStorage1.prototype.getSenderMessage = function() {
		return this.messages[this.senderMessageId];	
	};
	MessageStorage1.prototype.loadMessagesAsync = function() {
		var self = this;
		return self._loadMessagesIdsAsync().then(function(ids) {
			self.messageOffset += ids.length;
			if (self.messageOffset >= self.totalMessageCount) {
				self.trigger('end:messages');
			}
			ids = self._filterMessageIds(ids);
			return self._loadRawMessagesAsync(ids);	
		}).then(function(rawMessages) {
			self._addRawMessages(rawMessages);
		});
	};
	MessageStorage1.prototype._loadMessagesIdsAsync = function() {
		var self = this;
		return this.chatClientWrapper.getMessageIdsAsync(
			this.publicId,
			this.messageCount, 
			this.messageOffset
		).then(function(response) {
			self.totalMessageCount = self.totalMessageCount || response.messagecount;
			return response.data;
		});
	};
	MessageStorage1.prototype._loadRawMessagesAsync = function(ids) {
		return this.chatClientWrapper.getMessagesAsync(ids);
	};
	MessageStorage1.prototype._filterFirstMessageIds = function(ids) {
		this._filterMessageIds = this._filterNextMessageIds;
		
		var senderMessageId = this.getSenderMessageId();
		
		if (senderMessageId) {
			var msgId = ['msg', senderMessageId].join('.');
			ids = ids.filter(function(id) {
				return id !== msgId;
			});
			ids.unshift(msgId);
		}
		
		return ids;
	};
	MessageStorage1.prototype._filterNextMessageIds = function(ids) {
		var senderMessageId = this.getSenderMessageId();
		
		if (senderMessageId) {
			var msgId = ['msg', senderMessageId].join('.');
			ids = ids.filter(function(id) {
				return id !== msgId;	
			});
		}
		
		return ids;
	};
	MessageStorage1.prototype._addFirstRawMessages = function(rawMessages) {
		this._addRawMessages = this._addNextRawMessages;
		
		var self = this;
		var senderMessageId = this.getSenderMessageId();
		var hasSenderMessage = false;
		var messages = rawMessages.map(MessageModel.fromRaw);

		messages = messages.filter(function(message) {
			return message.isValid();
		});
		messages.forEach(function(message) {
			var messageId = message.get('id');
			senderMessageId = senderMessageId || messageId;
			hasSenderMessage = hasSenderMessage || senderMessageId === messageId;
			self.addMessage(message);
		});
		
		if (!hasSenderMessage) {
			var defaultMessage = MessageModel.default();
			this.addMessage(defaultMessage);
			this.setSenderMessageId(defaultMessage.get('id'));
		} else {
			this.setSenderMessageId(senderMessageId);
		}
	};
	MessageStorage1.prototype._addNextRawMessages = function(rawMessages) {
		var self = this;
		var messages = rawMessages.map(MessageModel.fromRaw);
		messages = messages.filter(function(message) {
			return message.isValid();
		});
		messages.forEach(function(message) {
			self.addMessage(message);
		});
	};
	
	var MessageStorage = function(chatWrapper) {
		MessageStorage.super.apply(this);
		var self = this;
		
		self.chatWrapper = chatWrapper;
		self.publicId = 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9';
		
		self.messages = {};
		self.preloadedMessages = {};
		
		self.currentMessageId = null;
		self.selectedMessageId = null;
		
		self.messageCount = 4;
		self.messageOffset = 0;
	};
	MessageStorage.super = EventEmitter;
	MessageStorage.prototype = Object.create(EventEmitter.prototype);
	MessageStorage.prototype.constructor = MessageStorage;
	MessageStorage.prototype.loadMessagesAsync = function() {
		var self = this;
		
		return self.chatWrapper.loadMessageIdsAsync(
			self.publicId, 
			self.messageCount, 
			self.messageOffset
		).then(function(data) {
			var ids = data.ids;
			return self.chatWrapper.loadMessagesAsync(ids);
		});
	};
	
	var PhotoStorage = function() {
		PhotoStorage.super.apply(this);
		
		this.count = 16;
		this.offset = 0;
		this.total = 0;
		
		this.photos = [];
		this.photoKeys = ['photo_807', 'photo_604', 'photo_130', 'photo'];
	};
	PhotoStorage.super = EventEmitter;
	PhotoStorage.prototype = Object.create(EventEmitter.prototype);
	PhotoStorage.prototype.constructor = PhotoStorage;
	PhotoStorage.prototype.loadPhotosAsync = function() {
		var self = this;
		return messenger.vk.apiAsync('photos.getAll', {
			offset: this.offset,
			count: this.count,
			https: 1,
			v: 5.12 
		}).then(function(response) {
			self.total = response.count;
			self.offset += response.items.length;
			if (self.offset >= self.total) {
				self.trigger('end:photos');
			}
			response.items.forEach(function(item) {
				var key;
				var keys = Object.keys(item);
				for (var i = 0; i < self.photoKeys.length; i++) {
					var photoKey = self.photoKeys[i];
					if (keys.indexOf(photoKey) !== -1) {
						key = photoKey;
						break;
					}
				}
				if (key) {
					self.addPhoto(item[key]);
				}
			});
		});
	};
	PhotoStorage.prototype.addPhoto = function(photo) {
		this.photos.push(photo);
		this.trigger({
			type: 'add:photo',
			photo: photo
		});
	};
	
	messenger.storage = {
		PaginationCollection: PaginationCollection,
		MessageStorage: MessageStorage1,
		PhotoStorage: PhotoStorage
	};
	
})(messenger, eve, Q);