window.onload = function() {
	
	var EventEmitter = eve.EventEmitter;
	var ChatClient = chat.ChatClient;
	
	var Model = abyss.Model;
	var View = abyss.View;
	
	var Helpers = {
		formatInputDate: function(date)	{
			var newDate = new Date(date);
			newDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
			return newDate.toJSON().slice(0, 10);
		}
	};
	
	var MessageModel = function() {
		MessageModel.super.apply(this);
	};
	MessageModel.super = Model;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;
	MessageModel.prototype.isValid = function() {
		return !!this.get('preview') && !!this.get('content');	
	};
	MessageModel.formRawData = function(rawData) {
		var message = new MessageModel();
		var value = rawData.value || {};
		
		var id = value.id;
		var sender = value.from;
		var receiver = value.to;
		var preview = value.preview;
		var content = value.content;
		
		message.set({
			id: id,
			sender: sender,
			receiver: receiver,
			preview: preview,
			content: content ? base64.decode(content) : null
		});
		
		return message;
	};
	
	var MessageView = function(model) {
		MessageView.super.apply(this);
		
		this.elem = template.create('message', { className: 'message' });
	};
	MessageView.super = View;
	MessageView.prototype = Object.create(View.prototype);
	MessageView.prototype.constructor = MessageView;
	
	var MessageStorage = function() {
		MessageStorage.super.apply(this);	
		
		this.messages = {};
	};
	MessageStorage.super = EventEmitter;
	MessageStorage.prototype = Object.create(EventEmitter.prototype);
	MessageStorage.prototype.constructor = MessageStorage;
	MessageStorage.prototype.has = function(messageId) {
		return this.messages.hasOwnProperty(messageId);
	};
	MessageStorage.prototype.add = function(message) {
		var messageId = message.get('id');
		if (!this.has(messageId)) {
			this.messages[messageId] = message;
			this.trigger({
				type: 'add:message',
				message: message
			});
		}	
	};
	MessageStorage.prototype.remove = function(messageId) {
		if (this.has(messageId)) {
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				messageId: messageId
			});
		}	
	};
	MessageStorage.prototype.clear = function() {
		Object.keys(this.messages).forEach(function(messageId) {
			this.remove(messageId);
		}, this);
	};
	
	var Application = function() {
		Application.super.apply(this);
		
		this.startElem = document.getElementById('start');
		this.endElem = document.getElementById('end');
		this.updateElem = document.getElementById('update');
		this.pageElem = document.getElementById('page');
		this.waitElem = document.getElementById('wait');
		this.statusElem = this.waitElem.getElementsByClassName('status')[0];
		
		this.messageViews = {};
		
		this.chatClient = new ChatClient('ws://www.bazelevscontent.net:9012/');
		this.account = 'analytics';
		
		this.messageStorage = new MessageStorage();
		
		this.initializeStartupData();
		this.initializeMessageStorage();
		this.initializeUI();
		this.initializeChatClient();
	};
	Application.super = EventEmitter;
	Application.prototype = Object.create(EventEmitter.prototype);
	Application.prototype.constructor = Application;
	Application.prototype.initializeStartupData = function() {
		var today = new Date();
		var yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		this.startElem.value = Helpers.formatInputDate(yesterday);
		this.endElem.value = Helpers.formatInputDate(today);
	};
	Application.prototype.initializeMessageStorage = function() {
		var self = this;
		this.messageStorage.on('add:message', function(event) {
			var message = event.message;
			var messageId = message.get('id');
			var messageView = new MessageView(message);
			messageView.attachTo(self.pageElem);
			self.messageViews[messageId] = messageView;
		});
		this.messageStorage.on('remove:message', function(event) {
			var messageId = event.messageId;
			var messageView = self.messageViews[messageId];
			messageView.dispose();
			delete self.messageViews[messageId];
		});
	};
	Application.prototype.initializeUI = function() {
		var self = this;
		this.updateElem.addEventListener('click', function() {
			var start = self.startElem.value;
			var end = self.endElem.value;
			var startTimestamp = new Date(start).getTime();
			var endTimestamp = new Date(end).getTime();
			
			self.chatClient.once('message:messagedump', function(event) {
				var messagedump = event.response.messagedump;
				if (typeof messagedump === 'string') {
					self.statusElem.textContent = [messagedump, 'Reboot the app!!!'].join(' ');
				} else {
					self.chatClient.retrieve(messagedump.join(','));		
				}
			});
			self.chatClient.once('message:retrieve', function(event) {
				self.messageStorage.clear();
				html.scrollToTop(document.body);
				var rawMessages = event.response.retrieve;
				var messages = rawMessages
					.map(MessageModel.formRawData)
					.filter(function(message) {
						return message.isValid();	
					});
				messages.forEach(function(message) {
					self.messageStorage.add(message);	
				});
				self.hideWaitElem();
			});
			self.chatClient.messagedump(startTimestamp, endTimestamp);
			self.showWaitElem();
		});
	};
	Application.prototype.initializeChatClient = function() {
		var self = this;
		this.chatClient.once('connect', function() {
			self.chatClient.login(self.account);
		});
		this.chatClient.once('message:login', function(event) {
			self.hideWaitElem();
		});
		this.chatClient.connect();
	};
	Application.prototype.showWaitElem = function() {
		this.waitElem.classList.remove('hidden');
		document.body.classList.add('no-overflow');
	};
	Application.prototype.hideWaitElem = function() {
		this.waitElem.classList.add('hidden');
		document.body.classList.remove('no-overflow');
	};
	
	var app = new Application();
};