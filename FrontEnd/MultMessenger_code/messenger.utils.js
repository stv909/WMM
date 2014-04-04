var messenger = messenger || {};

(function(messenger, async, settings, errors, Q) {
	
	var ErrorCodes = errors.ErrorCodes;
	
	var Helpers = {
		buildVkId: function(contact) {
			var contactId = contact.get('id');
			if (contactId >= 0) {
				return ['vkid', contactId].join('');
			} else {
				var type = contact.get('type');
				return ['vk', type, -contactId].join('');
			}
		},
		buidFbId: function(contact) {
			var contactId = contact.get('id');
			return ['fbid', contactId].join('');
		},
		getMessageTarget: function(sender, receiver) {
			var senderId = sender.get('id');
			var receiverId = receiver.get('id');
			if (senderId === receiverId) {
				return 'self';
			} else if (receiverId < 0) {
				return 'group';
			} else {
				return 'friend';
			}
		},
		normalizeMessageContent: function(content) {
			var wkTransformPattern = /(-webkit-transform:([^;]*);)/g;
			var mozTransformPattern = /(-moz-transform:([^;]*);)/g;
			var msTransformPattern = /(-ms-transform:([^;]*);)/g;
			var transformPattern = /([^-]transform:([^;]*);)/g;
			var wkTransformRepeatPattern = /(\s*-webkit-transform:([^;]*);\s*)+/g;
			
			var buildWkTransform = function(transformValue) {
				return ['-webkit-transform:', transformValue, ';'].join('');
			};
			var buildMozTransform = function(transformValue) {
				return ['-moz-transform:', transformValue, ';'].join('');
			};
			var buildMsTransform = function(transformValue) {
				return ['-ms-transform:', transformValue, ';'].join('');
			};
			var buildTransform = function(transformValue) {
				return ['transform:', transformValue, ';'].join('');
			};
			var replaceTransform = function(match, transform, transformValue) {
				return [
					buildWkTransform(transformValue), 
					buildMozTransform(transformValue),
					buildMsTransform(transformValue),
					buildTransform(transformValue)
				].join(' ');
			};
			var replaceWkTransform = function(match, transform, transformValue) {
				return buildWkTransform(transformValue);
			};
			
			return content
					.replace(mozTransformPattern, replaceWkTransform)
					.replace(msTransformPattern, replaceWkTransform)
					.replace(transformPattern, replaceWkTransform)
					.replace(wkTransformRepeatPattern, replaceTransform)
					.replace(mozTransformPattern, replaceWkTransform)
					.replace(msTransformPattern, replaceWkTransform)
					.replace(transformPattern, replaceWkTransform)
					.replace(wkTransformRepeatPattern, replaceTransform);
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

			if (ownerId === senderId) {
				content = 'Мой мульт!\nСмотреть: ';
			} else if (ownerId < 0) {
				content = 'Зацените мульт!\nСмотреть: ';
			} else {
				content = 'Тебе мульт!\nСмотреть: ';
			}
			
			return {
				owner_id: ownerId,
				message: [content, answerUrl].join(''),
				attachments: [imageId, fullAnswerUrl].join(','),
				v: 5.12
			};
		},
		checkPostAccess: function(contact) {
			if (!contact.get('canPost') && contact.get('id') >= 0) {
				throw {
					errorCode: ErrorCodes.RESTRICTED
				};
			}
		},
		formatError: function(error) {
			var result = [];
			var mainResult = error.errorCode === ErrorCodes.RESTRICTED ? 'reject' : 'fail';
			result.push(mainResult);
			if (mainResult === 'fail') {
				var message = error.message || {};
				if (message.error_code) {
					result.push(message.error_code);
				} 
				if (message.error_msg) {
					result.push(message.error_msg);
				}
			}
			return result.join('_');	
		}
	};
	
	var ChatClientWrapper = function(chatClient) {
		this.chatClient = chatClient;
		this.operationTimeout = 60000;
	};
	ChatClientWrapper.prototype._createRequestTask = function(checkReadyState) {
		var task = Q.defer();
		if (checkReadyState && this.chatClient.readyState() !== 1) {
			task.reject({
				errorCode: ErrorCodes.NO_CONNECTION
			});
		} else {
			setTimeout(function() {
				task.reject({
					errorCode: ErrorCodes.TIMEOUT
				});
			}, this.operationTimeout);
		}
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
		var task = this._createRequestTask(true);
		
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
		var task = this._createRequestTask(true);
		
		this.chatClient.once('message:retrieve', function(event) {
			var rawMessages = event.response.retrieve;
			task.resolve(rawMessages);
		});
		this.chatClient.retrieve(messageIds.join(','));
		
		return task.promise;
	};
	ChatClientWrapper.prototype.getProfileAsync = function(profileId) {
		var task = this._createRequestTask(true);
		
		this.chatClient.once('message:retrieve', function(event) {
			var profile = event.response.retrieve[0];
			task.resolve(profile);
		});
		this.chatClient.retrieve(profileId);
		
		return task.promise;
	};
	ChatClientWrapper.prototype.saveProfileAsync = function(profileId, data) {
		this.chatClient.store(null, profileId, data);
		return Q.resolve(true);
	};
	ChatClientWrapper.prototype.nowAsync = function() {
		var task = this._createRequestTask(true);
		
		this.chatClient.once('message:now', function(event) {
			var timestamp = event.response.now;
			task.resolve(timestamp);
		});
		this.chatClient.now();
		
		return task.promise;
	};
	ChatClientWrapper.prototype.sendMessageAsync = function(message) {
		var task = this._createRequestTask(true);
		
		this.chatClient.once('message:send', function(event) {
			var rawMessage = event.response.send;
			task.resolve(rawMessage);
		});
		this.chatClient.once('message:sent', function(event) {
			var rawMessage = event.response.send;
			task.resolve(rawMessage);
		});
		this.chatClient.sendMessage(message);
		
		return task.promise;
	};
	ChatClientWrapper.prototype.loadTapeAsync = function() {
		var task = this._createRequestTask(true);
		
		this.chatClient.once('message:tape', function(event) {
			var tape = event.response.tape;
			task.resolve(tape);
		});
		this.chatClient.tape();
		
		return task.promise;
	};
	
	messenger.utils = {
		VkTools: VkTools,
		ChatClientWrapper: ChatClientWrapper,
		Helpers: Helpers
	};
	
})(messenger, async, settings, errors, Q);