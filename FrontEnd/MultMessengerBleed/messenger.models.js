var messenger = messenger || {};

(function(messenger, abyss, base64, eve) {

	var Model = abyss.Model;
	var EventEmitter = eve.EventEmitter;
	
	var ChatWrapper = function(chatClient) {
		var self = this;
		self.chatClient = chatClient;
	};
	ChatWrapper.prototype.loadMessageIdsAsync = function(groupId, count, offset) {
		var self = this;
		var deferred = async.defer();
	
		self.chatClient.once('message:grouptape', function(event) {
			var grouptape = event.response.grouptape;
			if (grouptape.success) {
				deferred.resolve({
					count: grouptape.messagecount,
					ids: grouptape.data
				});
			} else {
				deferred.reject(new Error(grouptape.error));
			}
		});
		self.chatClient.grouptape(groupId, count, offset);
	
		return deferred.promise;
	};
	ChatWrapper.prototype.loadMessagesAsync = function(ids) {
		var self = this;
		var deferred = async.defer();
	
		self.chatClient.once('message:retrieve', function(event) {
			var rawMessages = event.response.retrieve;
			deferred.resolve(rawMessages);
		});
		self.chatClient.retrieve(ids.join(','));
	
		return deferred.promise;
	};
	
	var MessageStorage = function(chatClient) {
		MessageStorage.super.apply(this);
		var self = this;
		
		self.chatWrapper = new ChatWrapper(chatClient);
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

	var MessageModel = function() {
		MessageModel.super.apply(this);
	};
	MessageModel.super = Model;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;
	MessageModel.prototype.isValid = function() {
		return !!this.get('preview');	
	};
	MessageModel.fromChatMessage = function(chatMessage) {
		var value = chatMessage.value || {};
		var message = new MessageModel();
		message.set({
			id: value.id || -1,
			content: value.content ? base64.decode(value.content) : '',
			preview: value.preview ? [settings.imageStoreBaseUrl, value.preview].join('') : null
		});
		return message;
	};
	MessageModel.default = function() {
		var message = new MessageModel();
		message.set({
			id: '42',
			preview: 'https://www.bazelevscontent.net:8583/8b8cdae3-8842-4ecd-a067-ccda2cfe56f8.png',
			content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(https://lh6.googleusercontent.com/-pDyo6bISP5s/UwXAANbCjXI/AAAAAAAAFus/rbcJ2tUev7g/w448-h328-no/office_dresscode_2_back.png); background-size: auto; width: 403px; height: 403px; background-position: 0% 21%; background-repeat: no-repeat no-repeat;"><div class="tool_layerItem_ece920e7-b59b-4c00-9cc5-b4d093fd8a1a layerType_text" draggable="true" style="font-family: Impact; font-size: 1.9em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 5; left: 9px; top: 339px; -webkit-transform: rotate(0deg);">И НЕ НАДЕЛ ГАЛСТУК НА РАБОТУ</div><div class="tool_layerItem_cdd13bc9-151d-463a-bff7-f8f6f1f978a5 layerType_text" draggable="true" style="font-family: Impact; font-size: 1.5em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 4; left: 60px; top: 11px; -webkit-transform: rotate(0deg);">РЕШИЛ БЫТЬ САМИМ СОБОЙ</div><img src="https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;borac&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;happy&lt;/mood&gt;&lt;action&gt;point&lt;/action&gt;Ай эм секси энд ай ноу ит!&lt;gag&gt;party&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif&quot;}" class="tool_layerItem_5025a450-13c9-40a4-8410-94a1a1d30628 layerType_actor" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(0.5133420832795046) rotate(0deg); left: 96px; top: -87px; pointer-events: auto;"><img src="https://lh5.googleusercontent.com/-eI04EqemiLY/UwXAC7AICAI/AAAAAAAAFvU/_2AnZWHqjvs/w448-h328-no/office_dresscode_2_front.png" class="tool_layerItem_ff203327-3bd4-46a8-a0bc-98c5e38b342e layerType_img" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(1) rotate(0deg); left: -25px; top: 16px;"><img src="https://lh3.googleusercontent.com/--kaLl9jd890/UwXfgRqfPGI/AAAAAAAAFx0/qACqaTb0MjA/s403-no/7.png" class="tool_layerItem_312b95b5-4b85-4fea-b464-29510fc69ee9 layerType_img" draggable="true" style="position: absolute; z-index: 3; -webkit-transform: scale(1) rotate(0deg); left: 0px; top: 0px;"><div class="tool_layerItem_0cfd1126-2616-4977-808d-01e2201f258f layerType_text" draggable="true" style="font-family: Impact; font-size: 1em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 6; -webkit-transform: rotate(0deg); left: 107px; top: 376px;">НУ МОЖЕТ НЕ ТОЛЬКО ГАЛСТУК</div></div>'
		});
		return message;
	};

	var ContactModel = function() {
		ContactModel.super.apply(this);
	};
	ContactModel.super = Model;
	ContactModel.prototype = Object.create(Model.prototype);
	ContactModel.prototype.constructor = ContactModel;
	ContactModel.fromVkData = function(rawData) {
		var id = rawData.id;
		var firstName = rawData.first_name;
		var lastName = rawData.last_name;
		var photo = rawData.photo_200 || rawData.photo_100 || rawData.photo_50;
		var contact = new ContactModel();
		contact.set({
			id: id,
			firstName: firstName,
			lastName: lastName,
			photo: photo
		});
		return contact;
	};
	
	var MessageCollection = function(chatClient) {
		MessageCollection.super.apply(this);
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
	MessageCollection.super = EventEmitter;
	MessageCollection.prototype = Object.create(EventEmitter.prototype);
	MessageCollection.prototype.constructor = MessageCollection;
	MessageCollection.prototype.hasMessage = function(messageId) {
		return this.messages.hasOwnProperty(messageId);	
	};
	MessageCollection.prototype.addPreloadedMessage = function(message) {
		var messageId = message.get('id');
		if (!this.preloadedMessages.hasOwnProperty(messageId)) {
			this.messageOffset += 1;	
		}
		this.preloadedMessages[messageId] = message;
		this._notifyAboutValidPreloadMessages();
	};
	MessageCollection.prototype._notifyAboutValidPreloadMessages = function() {
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
	MessageCollection.prototype.appendPreloadedMessages = function() {
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
	MessageCollection.prototype.addMessage = function(message, first) {
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
	MessageCollection.prototype.removeMessage = function(messageId) {
		if (this.hasMessage(messageId)) {
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				messageId: messageId
			});
		}
	};
	MessageCollection.prototype.selectMessage = function (message) {
		this.currentMessage = message;
		this.trigger({
			type: 'select:message',
			message: this.currentMessage
		});
	};
	MessageCollection.prototype.setSenderMessageId = function(messageId) {
		this.senderMessageId = messageId;
	};
	MessageCollection.prototype.getSenderMessageId = function() {
		return this.senderMessageId;	
	};
	MessageCollection.prototype.getSenderMessage = function() {
		return this.messages[this.senderMessageId];	
	};
	MessageCollection.prototype.loadMessagesAsync = function() {
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
	MessageCollection.prototype._loadMessagesIdsAsync = function() {
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
	MessageCollection.prototype._loadRawMessagesAsync = function(ids) {
		var deferred = async.defer();
		
		this.chatClient.once('message:retrieve', function(event) {
			var rawMessages = event.response.retrieve;
			deferred.resolve(rawMessages);
		});
		this.chatClient.retrieve(ids.join(','));
		
		return deferred.promise;
	};
	MessageCollection.prototype._filterFirstMessageIds = function(ids) {
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
	MessageCollection.prototype._filterNextMessageIds = function(ids) {
		var senderMessageId = this.getSenderMessageId();
		
		if (senderMessageId) {
			var msgId = ['msg', senderMessageId].join('.');
			ids = ids.filter(function(id) {
				return id !== msgId;	
			});
		}
		
		return ids;
	};
	MessageCollection.prototype._addFirstRawMessages = function(rawMessages) {
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
	MessageCollection.prototype._addNextRawMessages = function(rawMessages) {
		var self = this;
		var messages = rawMessages.map(MessageModel.fromChatMessage);
		messages = messages.filter(function(message) {
			return message.isValid();
		});
		messages.forEach(function(message) {
			self.addMessage(message);
		});
	};

	messenger.models = {
		MessageModel: MessageModel,
		ContactModel: ContactModel,
		MessageCollection: MessageCollection
	};

})(messenger, abyss, base64, eve);