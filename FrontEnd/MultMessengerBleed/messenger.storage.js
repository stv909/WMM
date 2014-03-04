var messenger = messenger || {};

(function(messenger, eve, async) {
	
	var EventEmitter = eve.EventEmitter;
	var ContactModel = messenger.models.ContactModel;
	var MessageModel = messenger.models.MessageModel;
	
	var ContactStorage = function() {
		var self = this;
		ContactStorage.super.apply(self);
		
		self.owner = null;
		self.friends = [];
		
		self.searchCollection = null;
	};
	ContactStorage.super = EventEmitter;
	ContactStorage.prototype = Object.create(EventEmitter.prototype);
	ContactStorage.prototype.constructor = ContactStorage;
	ContactStorage.prototype.initializeAsync = function() {
		var self = this;
		var loadOwnerTask = self._loadOwnerAsync();
		var loadFriendsTask = self._loadFriendsAsync(1000, 0);
		var tasks = [loadOwnerTask, loadFriendsTask];
		return Promise.all(tasks).then(function() {
			self.search();
		});
	};
	ContactStorage.prototype._loadOwnerAsync = function() {
		var self = this;
		return VK.apiAsync('users.get', {
			fields: [ 'photo_200', 'photo_100', 'photo_50' ].join(','),
			name_case: 'nom',
			v: 5.12
		}).then(function(response) {
			var rawOwner = response[0];
			var owner = ContactModel.fromVkData(rawOwner);
			self.owner = owner;
			self.owner.set({
				firstName: 'Я',
				lastName: '',
			});
		});
	};
	ContactStorage.prototype._loadFriendsAsync = function(count, offset) {
		//97383475 - more 1k friends
		var self = this;
		return VK.apiAsync('friends.get', {
			user_id: 97383475,
			count: count,
			offset: offset,
			fields: [ 'photo_200', 'photo_100', 'photo_50' ].join(','),
			name_case: 'nom',
			v: 5.12
		}).then(function(response) {
			var rawFriends = response.items;
			var friendCount = rawFriends.length;
			rawFriends.forEach(function(rawFriend) {
				var friend = ContactModel.fromVkData(rawFriend);
				self.friends.push(friend);
			});
			if (friendCount !== 0) {
				return self._loadFriendsAsync(count, offset + friendCount);
			}
		});
	};
	ContactStorage.prototype.search = function(query) {
		var searchCollection = new PaginationCollection(this.friends);
		searchCollection.count = 21;
		this._setSearchCollection(searchCollection);
	};
	ContactStorage.prototype._search = function(query) {
		return [];
	};
	ContactStorage.prototype._setSearchCollection = function(searchCollection) {
		if (this.searchCollection) {
			this.searchCollection.dispose();
		}
		this.searchCollection = searchCollection;
		this.trigger({
			type: 'update:search',
			contacts: this.searchCollection
		});
	};
	
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
	
	var CharacterStorage = function() {
		CharacterStorage.super.apply(this);
	};
	CharacterStorage.super = EventEmitter;
	CharacterStorage.prototype = Object.create(EventEmitter.prototype);
	CharacterStorage.prototype.constructor = CharacterStorage;
	CharacterStorage.prototype.initializeAsync = function() {
		var self = this;
		return async.requestAsync({
			url: 'https://bazelevshosting.net/MCM/characters_resources.json',
			method: 'GET',
			data: null
		}).then(function(rawData) {
			var response = JSON.parse(rawData);
			var characters = response.characters;
			self.trigger({
				type: 'update:characters',
				characters: characters
			});
		});
	};
	
	var MessageStorage1 = function(chatClient) {
		MessageStorage1.super.apply(this);
		var self = this;
		
		this.chatClient = chatClient;
		
		this.publicId = 'public.9205ef2d-4a2c-49dd-8203-f33a3ceac6c9';
		//this.publicId = 'public.bc53e8d2-d372-49c2-a91b-2d3b0aaffcb6'; //empty
		
		this.preloadedMessages = {};
		this.messages = {};
		this.currentMessage = null;
		
		this.senderMessageId = null;
		
		this.messageCount = 4;
		this.messageOffset = 0;
		this.totalMessageCount = 0;
		
		this._filterMessageIds = this._filterFirstMessageIds;
		this._addRawMessages = this._addFirstRawMessages;
		
		var messageRecieveListener = function(rawMessage) {
			var value = rawMessage.value || {};
			var group = value.group || "";
			var message = MessageModel.fromChatMessage(rawMessage);
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
		console.log('valid ' + validMessageCount);
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
		var deferred = async.defer();
		var self = this;
		
		this.chatClient.once('message:grouptape', function(event) {
			var grouptape = event.response.grouptape;
			self.totalMessageCount = self.totalMessageCount || grouptape.messagecount;
			if (grouptape.success) {
				deferred.resolve(grouptape.data);
			} else {
				deferred.resolve([]);
			}
		});
		this.chatClient.grouptape(this.publicId, this.messageCount, this.messageOffset);
		
		return deferred.promise;
	};
	MessageStorage1.prototype._loadRawMessagesAsync = function(ids) {
		var deferred = async.defer();
		
		this.chatClient.once('message:retrieve', function(event) {
			var rawMessages = event.response.retrieve;
			deferred.resolve(rawMessages);
		});
		this.chatClient.retrieve(ids.join(','));
		
		return deferred.promise;
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
		var messages = rawMessages.map(MessageModel.fromChatMessage);
		
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
		var messages = rawMessages.map(MessageModel.fromChatMessage);
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
	
	messenger.storage = {
		ContactStorage: ContactStorage,
		CharacterStorage: CharacterStorage,
		PaginationCollection: PaginationCollection,
		MessageStorage: MessageStorage1,
	};
	
})(messenger, eve, async);