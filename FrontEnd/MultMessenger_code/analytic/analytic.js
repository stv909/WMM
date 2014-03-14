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
			preview: preview ? ['http://www.bazelevscontent.net:8582/', preview].join('') : null,
			content: content ? base64.decode(content) : null
		});
		
		return message;
	};
	
	var MessageView = function(model) {
		MessageView.super.apply(this);
		var self = this;
		
		this.elem = template.create('message', { className: 'message normal' });
		this.contentElem = this.elem.getElementsByClassName('content')[0];
		
		this.receiverElem = this.elem.getElementsByClassName('receiver')[0];
		this.senderElem = this.elem.getElementsByClassName('sender')[0];
		
		this.selected = false;
		
		this.setModel(model);
		
		var elemClickListener = function() {
			if (!self.selected) {
				self.select();
			}
		};
		this.elem.addEventListener('click', elemClickListener);
		
		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);	
		});
	};
	MessageView.super = View;
	MessageView.prototype = Object.create(View.prototype);
	MessageView.prototype.constructor = MessageView;
	MessageView.prototype.prepareCachedPreviewElem = function() {
		this.cachedPreviewElem = document.createElement('div');
		var imgElem = document.createElement('img');
		imgElem.src = this.model.get('preview');
		this.cachedPreviewElem.appendChild(imgElem);
	};
	MessageView.prototype.prepareCachedFullElem = function() {
		this.cachedFullElem = document.createElement('div');
		this.cachedFullElem.innerHTML = this.model.get('content');
	};
	MessageView.prototype.addCachedElem = function(cachedElem) {
		this.cachedElem = cachedElem;
		this.contentElem.appendChild(cachedElem);
	};
	MessageView.prototype.removeCachedElem = function() {
		if (this.cachedElem) {
			this.contentElem.removeChild(this.cachedElem);
		}
	};
	MessageView.prototype.prepareLinkElems = function() {
		var sender = this.model.get('sender');
		var receiver = this.model.get('receiver');
		
		this.senderElem.textContent = sender;
		this.receiverElem.textContent = receiver;
		
		var prepareLink = function(elem, data) {
			if (data.indexOf('vkid') === 0) {
				elem.href = ['https://vk.com/id', data.replace('vkid', '')].join('');
			}	
		};
		
		prepareLink(this.senderElem, sender);
		prepareLink(this.receiverElem, receiver);
	};
	MessageView.prototype.setModel = function(model) {
		this.model = model;
		this.removeCachedElem();
		this.prepareCachedPreviewElem();
		this.prepareCachedFullElem();
		this.prepareLinkElems();
		if (this.selected) {
			this.addCachedElem(this.cachedFullElem);
		} else {
			this.addCachedElem(this.cachedPreviewElem);
		}
	};
	MessageView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
		this.removeCachedElem();
		this.addCachedElem(this.cachedFullElem);
		this.trigger({
			type: 'select',
			message: this.model
		});
	};
	MessageView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.removeCachedElem();
		this.addCachedElem(this.cachedPreviewElem);
	};
	
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
		this.selectedMessageView = null;
		
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
			messageView.on('select', function(event) {
				if (self.selectedMessageView) {
					self.selectedMessageView.deselect();
					self.selectedMessageView = null;
				}
				self.selectedMessageView = messageView;
			});
			self.messageViews[messageId] = messageView;
		});
		this.messageStorage.on('remove:message', function(event) {
			var messageId = event.messageId;
			var messageView = self.messageViews[messageId];
			messageView.dispose();
			delete self.messageViews[messageId];
			self.selectedMessageView = null;
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
			//self.updateElem.click();
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