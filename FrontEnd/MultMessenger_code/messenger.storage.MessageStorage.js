var message = message || {};

(function(message, eve, settings) {
	
	var EventEmitter = eve.EventEmitter;
	
	var MessageCollection = function() {
		this.messages = {};
	};
	MessageCollection.super = EventEmitter;
	MessageCollection.prototype = Object.create(EventEmitter.prototype);
	MessageCollection.prototype.super = MessageCollection;
	MessageCollection.prototype.has = function(messageId) {
		return this.messages.hasOwnProperty(messageId);	
	};
	MessageCollection.prototype.add = function(message) {
		var messageId = message.get('id');
		if (!this.has(messageId)) {
			this.messages[messageId] = message;
			this.trigger({
				type: 'add:message',
				message: message
			});
		}
	};
	MessageCollection.prototype.remove = function(messageId) {
		if (this.has(messageId)) {
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				messageId: messageId
			});
		}
	};
	MessageCollection.prototype.clear = function() {
		var self = this;
		Object.keys(this.messages).forEach(function(key) {
			self.remove(key);
		});
		this.messages = {};
	};
	
	var MessageStorage = function(clientChatWrapper) {
		MessageStorage.super.apply(this);
		
		this.clientChatWrapper = clientChatWrapper;
		this.clientChat = clientChatWrapper.clientChat;
		
		this.publicId = settings.publicId;
		this.streamMessages = new MessageCollection();
		this.persistMessages = new MessageCollection();

		this.selectedMessage = null;
		this.senderMessage = null;
		this.senderMessageId = null;
	};
	MessageStorage.super = EventEmitter;
	MessageStorage.prototype = Object.create(EventEmitter.prototype);
	MessageStorage.prototype.constructor = MessageStorage;
	MessageStorage.prototype.prepareClientChat = function() {
		
	};
	MessageStorage.prototype.prepareMessageCollections = function() {
		
	};
	
	message.storage = message.storage.storage;
	
	message.storage.MessageStorage = MessageStorage;
	
})(message, eve, settings);