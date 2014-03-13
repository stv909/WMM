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
	MessageModel.formRawData = function() {
		var message = new MessageModel();
		return message;
	};
	
	var MessageView = function(model) {
		MessageView.super.apply(this);
	};
	MessageView.super = View;
	MessageView.prototype = Object.create(View.prototype);
	MessageView.prototype.constructor = MessageView;
	
	var MessageStorage = function() {
		MessageStorage.super.apply(this);	
	};
	MessageStorage.super = EventEmitter;
	MessageStorage.prototype = Object.create(EventEmitter.prototype);
	MessageStorage.prototype.constructor = MessageStorage;
	
	var Application = function() {
		Application.super.apply(this);
		
		this.startElem = document.getElementById('start');
		this.endElem = document.getElementById('end');
		this.updateElem = document.getElementById('update');
		
		this.waitElem = document.getElementById('wait');
		
		this.chatClient = new ChatClient('ws://www.bazelevscontent.net:9009/');
		this.account = 'analytics';
		
		this.initializeStartupData();
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
	Application.prototype.initializeUI = function() {
		var self = this;
		this.updateElem.addEventListener('click', function() {
			var start = self.startElem.value;
			var end = self.endElem.value;
			console.log(start);
			console.log(end);
		});
	};
	Application.prototype.initializeChatClient = function() {
		var self = this;
		this.chatClient.once('connect', function() {
			self.chatClient.login(self.account);
		});
		this.chatClient.once('message:login', function() {
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