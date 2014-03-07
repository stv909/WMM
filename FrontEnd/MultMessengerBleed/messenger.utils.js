var messenger = messenger || {};

(function(messenger, async, settings, errors, Q) {
	
	var ErrorCodes = errors.ErrorCodes;
	
	var Helpers = {
		buildVkId: function(contact) {
			var contactId = contact.get('id');
			return ['vkid', contactId].join('');
		},
		buidFbId: function(contact) {
			var contactId = contact.get('id');
			return ['fbid', contactId].join('');
		}
	};
	
	var VkTools = {
		getWallPhotoUploadUrlAsync: function() {
			return VK.apiAsync('photos.getWallUploadServer', { 
				v: 5.12 
			}).then(function(response) {
				return response.upload_url;
			});	
		},
		calculateMessageShareUrl: function(messageId) {
			return [settings.shareMessageBaseUrl, messageId].join('');
		},
		generatePreviewAsync: function(messageShareUrl, uploadUrl) {
			var requestData = {
				uploadUrl: uploadUrl,
				url: messageShareUrl,
				imageFormat: 'png',
				scale: 1,
				contentType: 'vkUpload'
			};
			var rawRequestData = JSON.stringify(requestData);
			var options = {
				url: settings.previewGeneratorUrl,
				method: 'POST',
				data: 'type=render&data=' + encodeURIComponent(rawRequestData)
			};
			return async.requestAsync(options).then(function(rawData) {
				var response = JSON.parse(rawData);
				return response;
			});
		},
		getUploadedFileId: function(response) {
			return ['photo', response[0].owner_id, '_', response[0].id].join('');
		},
		createVkPost: function(message, ownerId, senderId, imageId, shareUrl) {
			var content = null;
			var appUrl = settings.vkAppUrl;
			var hash = ['senderId=', senderId, '&messageId=', message.id].join('');
			var answerUrl = [appUrl, '#', hash].join('');
			var fullAnswerUrl = ['https://', answerUrl].join('');
			
			if (message.from === message.to) {
				content = 'Мой мульт! \nСмотреть: ';
			} else {
				content = 'Тебе мульт! \nСмотреть: ';
			}
			
			return {
				owner_id: ownerId,
				message: [content, answerUrl].join(''),
				attachments: [imageId, fullAnswerUrl].join(','),
				v: 5.12
			};
		}
	};
	
	var ChatClientWrapper = function(chatClient) {
		this.chatClient = chatClient;
		this.operationTimeout = 30000;
	};
	ChatClientWrapper.prototype._createRequestTask = function() {
		var task = Q.defer();
		setTimeout(function() {
			task.reject({
				errorCode: ErrorCodes.TIMEOUT
			});
		}, this.operationTimeout);
		return task;
	};
	ChatClientWrapper.prototype.connectAsync = function() {
		var task = this._createRequestTask();
		
		this.chatClient.once('connect', function(event) {
			task.resolve();
		});
		this.chatClient.connect();
		
		return task.promise;
	};
	ChatClientWrapper.prototype.loginAsync = function(account) {
		var task = this._createRequestTask();
		
		this.chatClient.once('message:login', function(event) {
			task.resolve(); 
		});
		this.chatClient.login(account);
		
		return task.promise;
	};
	ChatClientWrapper.prototype.connectAndLoginAsync = function(account) {
		var self = this;
		return this.connectAsync().then(function() {
			return self.loginAsync(account);
		});
	};
	ChatClientWrapper.prototype.getMessageIdsAsync = function(groupId, count, offset) {
		var task = this._createRequestTask();
		
		this.chatClient.once('message:grouptape', function(event) {
			var grouptape = event.response.grouptape;
			if (grouptape.success) {
				task.resolve({
					messagecount: grouptape.messagecount,
					data: grouptape.data
				});
			} else {
				task.resolve({
					messagecount: 0,
					data: []
				});
			}
		});
		this.chatClient.grouptape(groupId, count, offset);
		
		return task.promise;
	};
	ChatClientWrapper.prototype.getMessagesAsync = function(messageIds) {
		var task = this._createRequestTask();
		
		this.chatClient.once('message:retrieve', function(event) {
			var rawMessages = event.response.retrieve;
			task.resolve(rawMessages);
		});
		this.chatClient.retrieve(messageIds.join(','));
		
		return task.promise;
	};
	ChatClientWrapper.prototype.nowAsync = function() {
		var task = this._createRequestTask();
		
		this.chatClient.once('message:now', function(event) {
			var timestamp = event.response.now;
			task.resolve(timestamp);
		});
		this.chatClient.now();
		
		return task.promise;
	};
	ChatClientWrapper.prototype.sendMessageAsync = function(message) {
		var task = this._createRequestTask();
		
		this.chatClient.once('message:send', function(event) {
			var rawMessage = event.response.send;
			task.resolve(rawMessage);
		});
		this.chatClient.sendMessage(message);
		
		return task.promise;
	};
	
	messenger.utils = {
		VkTools: VkTools,
		ChatClientWrapper: ChatClientWrapper,
		Helpers: Helpers
	};
	
})(messenger, async, settings, errors, Q);