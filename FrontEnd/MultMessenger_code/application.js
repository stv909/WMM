window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var ContactRepository = messenger.repository.ContactRepository;
	
	var MessageStorage = messenger.storage.MessageStorage;

	var MainMenuView = messenger.views.MainMenuView;
	var MainContainerView = messenger.views.MainContainerView;
	var PostcardMenuView = messenger.views.PostcardMenuView;
	var PostcardView = messenger.views.PostcardView;
	
	var SelectPageView = messenger.views.SelectPageView;
	var EditPageView = messenger.views.EditPageView;
	var PostPageView = messenger.views.PostPageView;
	var AnswerPageView = messenger.views.AnswerPageView;
	var PostDialogView = messenger.views.PostDialogView;
	var SkipDialogView = messenger.views.SkipDialogView;
	var AskMessageDialogView = messenger.views.AskMessageDialogView;
	var PreloadDialogView = messenger.views.PreloadDialogView;
	var ErrorDialogView = messenger.views.ErrorDialogView;
	var MessagePatternView = messenger.views.MessagePatternView;
	
	var VkTools = messenger.utils.VkTools;
	var ChatClientWrapper = messenger.utils.ChatClientWrapper;
	var Helpers = messenger.utils.Helpers;

	var ChatClient = chat.ChatClient;
	var MessageFactory = chat.MessageFactory;

	var MessengerApplication = function() {
		MessengerApplication.super.apply(this);
		var self = this;
		
		this.rootElem = document.getElementById('root');

		this.chatClient = new ChatClient(settings.chatUrl);
		this.chatClientWrapper = new ChatClientWrapper(this.chatClient);
		
		this.messageStorage = new MessageStorage(this.chatClientWrapper);
		
		this.contactRepository = new ContactRepository();

		this.mainMenuView = new MainMenuView();
		this.mainContainerView = new MainContainerView();
		this.postcardView = new PostcardView();
		this.postcardMenuView = new PostcardMenuView();
		
		this.selectPageView = new SelectPageView();
		this.editPageView = new EditPageView();
		this.postPageView = new PostPageView();
		this.answerPageView = new AnswerPageView();
		
		this.postDialogView = new PostDialogView();
		this.skipDialogView = new SkipDialogView();
		this.preloadDialogView = new PreloadDialogView();
		this.askMessageDialogView = new AskMessageDialogView();
		this.errorDialogView = new ErrorDialogView();

		this.currentSkipAnswerAsync = null;
		this.emptySkipAnswerAsync = function() {
			return Q.resolve(true);	
		};
		this.requestedSkipAnswerAsync = function() {
			var deferred = Q.defer();
			
			var cancelListener = function() {
				self.skipDialogView.off('click:ok', okListener);
				deferred.reject();
			};
			var okListener = function() {
				self.skipDialogView.off('click:cancel', cancelListener);
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				deferred.resolve();
			};
			
			self.skipDialogView.once('click:cancel', cancelListener);
			self.skipDialogView.once('click:ok', okListener);
			self.skipDialogView.setText('Вы уверены, что не хотите ответить на сообщение?');
			self.skipDialogView.show();
			
			return deferred.promise;
		};
		
		this.currentSkipUpdateAsync = null;
		this.emptySkipUpdateAsync = function() {
			return Q.resolve(true);
		};
		this.requestedSkipUpdateAsync = function() {
			var deferred = Q.defer();
			
			var cancelListener = function() {
				self.askMessageDialogView.off('click:ok', okListener);
				deferred.reject();
			};
			var okListener = function() {
				self.askMessageDialogView.off('click:cancel', cancelListener);
				self.currentSkipAnswerAsync = self.emptySkipUpdateAsync;
				deferred.resolve();
			};
			
			self.askMessageDialogView.once('click:cancel', cancelListener);
			self.askMessageDialogView.once('click:ok', okListener);
			self.askMessageDialogView.show();
			
			return deferred.promise;
		};
		
		this.preloadDialogView.show();
		this.initializeStorage();
		this.initializeChatClient();
		this.initializeViews();
		this.initializeSettings();
		this.initializeStartupData();
	};
	MessengerApplication.super = EventEmitter;
	MessengerApplication.prototype = Object.create(EventEmitter.prototype);
	MessengerApplication.prototype.constructor = MessengerApplication;
	MessengerApplication.prototype.initializeStorage = function() {
		var self = this;
		
		this.messageStorage.on('add:message', function(event) {
			var message = event.message;
			var first = event.first;
			var messagePatternView = new MessagePatternView(message);
			self.selectPageView.addMessagePatternView(messagePatternView, first);
		});
		this.messageStorage.on('select:message', function(event) {
			var message = event.message;
			self.editPageView.setMessage(message);
		});
		this.messageStorage.on('preload:update', function(event) {
			var count = event.count;
			self.selectPageView.setPreloadedMessageCount(count);
		});
		this.messageStorage.on('end:messages', function() {
			self.selectPageView.hideMessageLoading();	
		});
		(function() {
			var users = null;
			var groups = null;
			
			self.contactRepository.on('search:users', function(event) {
				if (users) users.dispose();
				self.postPageView.friendSearchView.clear();
				self.postPageView.friendSearchView.showLoader();
				self.postPageView.friendSearchView.off('click:load');
				self.postPageView.friendSearchView.on('click:load', function() {
					users.next();
				});
				users = event.users;
				users.on('paginate:item', function(event) {
					var friend = event.item;
					self.postPageView.friendSearchView.addFriend(friend);
				});
				users.on('paginate:end', function(event) {
					self.postPageView.friendSearchView.hideLoader();
				});
				users.next();
			});
			self.contactRepository.on('search:groups', function(event) {
				if (groups) groups.dispose();
				self.postPageView.groupSearchView.clear();
				self.postPageView.groupSearchView.showLoader();
				self.postPageView.groupSearchView.off('click:load');
				self.postPageView.groupSearchView.on('click:load', function() {
					groups.next();	
				});
				groups = event.groups;
				groups.on('paginate:item', function(event) {
					var group = event.item;
					self.postPageView.groupSearchView.addGroup(group);
				});
				groups.on('paginate:end', function(event) {
					self.postPageView.groupSearchView.hideLoader();
				});
				groups.next();
			});
			self.contactRepository.on('empty:groups', function(event) {
				self.postPageView.disableGroupTab();
			});
		})();
	};
	MessengerApplication.prototype.initializeChatClient = function() {
		var self = this;
		
		var checkOnline = function() {
			self.chatClientWrapper.nowAsync().then(function() {
				self.trigger('online');
			}).catch(function() {
				self.trigger('offline');
			});
		};
		var reconnect = function() {
			var vkId = Helpers.buildVkId(self.contactRepository.owner);
			VK.initAsync().then(function() {
				return self.chatClientWrapper.connectAndLoginAsync(vkId);
			}).then(function() {
				self.trigger('online');
			}).catch(function() {
				self.trigger('offline');
			});
		};
		
		this.on('online', function() {
			//self.onlineElem.classList.remove('invalid');
			setTimeout(function() {
				checkOnline();
			}, 2500);
		});
		this.on('offline', function() {
			//self.onlineElem.classList.add('invalid');
			setTimeout(function() {
				reconnect();
			}, 5000);
		});
		
		this.chatClient.once('message:login', function() {
			checkOnline();	
		});
	};
	MessengerApplication.prototype.initializeViews = function() {
		var self = this;

		this.mainMenuView.attachTo(this.rootElem);
		this.mainContainerView.attachTo(this.rootElem);
		this.answerPageView.attachTo(this.mainContainerView.elem);
		this.postcardView.attachTo(this.mainContainerView.elem);
		this.postcardMenuView.attachTo(this.postcardView.elem);
		
		this.selectPageView.attachTo(this.postcardView.elem);
		this.editPageView.attachTo(this.postcardView.elem);
		this.postPageView.attachTo(this.postcardView.elem);
		
		this.mainMenuView.on('click:answer', function() {
			self.answerPageView.show();
			self.postcardView.hide();
		});
		this.mainMenuView.on('click:logo', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.mainMenuView.postcardItemView.select();
				self.postcardMenuView.selectItemView.select();
			});
		});
		this.mainMenuView.on('click:postcard', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.show();
			}).catch(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		});
		this.mainMenuView.on('click:dialog', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.hide();
			}).catch(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		});
		this.mainMenuView.on('click:conversation', function() {
			self.currentSkipAnswerAsync().then(function() {
				self.answerPageView.hide();
				self.postcardView.hide();
			}).catch(function() {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.mainMenuView.restore();
				self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
			});
		});
		
		this.postcardMenuView.on('click:select', function() {
			self.answerPageView.hide();
			self.selectPageView.show();
			self.editPageView.hide();
			self.postPageView.hide();
		});
		this.postcardMenuView.on('click:edit', function() {
			self.answerPageView.hide();
			self.selectPageView.hide();
			self.editPageView.show();
			self.postPageView.hide();
		});
		this.postcardMenuView.on('click:post', function() {
			self.currentSkipUpdateAsync().then(function() {
				self.answerPageView.hide();
				self.selectPageView.hide();
				self.editPageView.hide();
				self.postPageView.show();
			}).catch(function() {
				self.currentSkipUpdateAsync = self.emptySkipUpdateAsync;
				self.postcardMenuView.editItemView.select();
				self.currentSkipUpdateAsync = self.requestedSkipUpdateAsync;
			});
		});
		this.postcardMenuView.selectItemView.select();

		this.answerPageView.on('click:answer', function(event) {
			self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
			self.mainMenuView.postcardItemView.select();
			self.currentSkipAnswerAsync = self.requestedSkipAnswerAsync;
		});
		
		this.selectPageView.on('select:message', function(event) {
			var message = event.message;
			self.messageStorage.selectMessage(message);
		});
		this.selectPageView.on('click:load', function(event) {
			self.selectPageView.disableMessageLoading();
			self.messageStorage.loadMessagesAsync().then(function() {
				analytics.send('tape', 'msg_load_more', 'success');
			}).catch(function(error) {
				self.errorDialogView.show(error);
				analytics.send('tape', 'msg_load_more', 'fail');
			}).fin(function() {
				self.selectPageView.enableMessageLoading();
			});
		});
		this.selectPageView.on('click:preload', function(event) {
			self.messageStorage.appendPreloadedMessages();	
			analytics.send('tape', 'msg_load_new', 'success');
		});
		
		this.postDialogView.on('click:close', function(event) {
			if (self.currentSkipAnswerAsync === self.requestedSkipAnswerAsync) {
				self.currentSkipAnswerAsync = self.emptySkipAnswerAsync;
				self.postPageView.friendSearchView.selectFriend(self.contactRepository.owner);
				self.postPageView.setMode('friend');
				self.postcardMenuView.selectItemView.select();
				window.location.hash = '';
			}	
		});
		
		this.skipDialogView.on('click:ok', function(event) {
			self.postPageView.friendSearchView.selectFriend(self.contactRepository.owner);
			self.postPageView.setMode('friend');
			self.postcardMenuView.selectItemView.select();
			window.location.hash = '';
			analytics.send('answer', 'browse_tape');
		});
		
		this.postPageView.on('click:send', function(event) {
			self.postDialogView.show();
			
			var account = self.contactRepository.owner;
			var companion = self.contactRepository.selected;
			var content = self.editPageView.getMessageContent();
			var message = MessageFactory.create(
				uuid.v4(),
				Helpers.normalizeMessageContent(content),
				Helpers.buildVkId(account),
				Helpers.buildVkId(companion)
			);
			var messageTarget = Helpers.getMessageTarget(account, companion);
			var action = ['post', messageTarget].join('_');
			var shareMessageUrl = VkTools.calculateMessageShareUrl(message.id);
			
			self.chatClientWrapper.nowAsync().then(function(timestamp) {
				VkTools.checkPostAccess(companion);
				self.postDialogView.setText('Этап 2 из 5: Сохранение сообщения...');
				message.timestamp = timestamp;
				return self.chatClientWrapper.sendMessageAsync(message);
			}).then(function() {
				self.postDialogView.setText('Этап 3 из 5: Создание превью...');
				return VkTools.getWallPhotoUploadUrlAsync();
			}).then(function(uploadUrl) {
				return VkTools.generatePreviewAsync(shareMessageUrl, uploadUrl);
			}).then(function(response) {
				self.postDialogView.setText('Этап 4 из 5: Сохранение превью в альбоме...');
				var uploadResult = response.uploadResult;
				var image = response.image;
				message.preview = image;
				self.chatClient.notifyMessage(message);
				uploadResult.v = 5.12;
				return VK.apiAsync('photos.saveWallPhoto', uploadResult);
			}).then(function(response) {
				self.postDialogView.setText('Этап 5 из 5: Публикация сообщения на стене...');
				var imageId = VkTools.getUploadedFileId(response);
				var ownerId = companion.get('id');
				var senderId = account.get('id');
				var postData = VkTools.createVkPost(message, ownerId, senderId, imageId, shareMessageUrl);
				return VK.apiAsync('wall.post', postData);
			}).then(function() {
				self.postDialogView.setMode('complete');
				analytics.send('post', action, 'success');
			}).catch(function(error) {
				self.postDialogView.setMode('fail', error);
				console.error(error);
				analytics.send('post', action, VkTools.formatError(error));
			});	
		});
		this.postPageView.friendSearchView.on('search:users', function(event) {
			self.contactRepository.searchUsers(event.text);
		});
		this.postPageView.groupSearchView.on('search:groups', function(event) {
			self.contactRepository.searchGroups(event.text);
		});
		this.postPageView.friendSearchView.on('select:user', function(event) {
			self.contactRepository.selected = event.user;
		});
		this.postPageView.groupSearchView.on('select:group', function(event) {
			self.contactRepository.selected = event.group;
		});
		
		this.editPageView.on('status:validate', function() {
			self.currentSkipUpdateAsync = self.emptySkipUpdateAsync;
		});
		this.editPageView.on('status:invalidate', function() {
			self.currentSkipUpdateAsync = self.requestedSkipUpdateAsync;
		});
		
		this.askMessageDialogView.on('click:ok', function() {
			self.editPageView.reset();
		});
		
		// this.groupElem.addEventListener('click', function() {
		// 	window.open(settings.groupUrl, '_blank');
		// 	analytics.send('app_start', 'app_go_group');
		// });
	};
	MessengerApplication.prototype.initializeSettings = function() {
		var parseHash = function(hash) {
			var settings = {};
			hash = hash.indexOf('=') === 0 ? hash.substring(1) : hash;
			hash = hash.replace('amp;', '');
			hash.split('&').forEach(function(item) {
				var pair = item.split('=');
				var key = pair[0];
				var value = pair[1];
				settings[key] = value;
			});
			return settings;
		};
		var parseSearch = function(search) {
			var settings = {};
			search.substring(1).split('&').forEach(function(item) {
				var pair = item.split('=');
				var key = pair[0];
				var value = pair[1];
				settings[key] = value;
			});
			return settings;
		};
		
		var search = window.location.search;
		var searchSettings = parseSearch(search);
		var hash = searchSettings.hash ? decodeURIComponent(searchSettings.hash) : null;

		if (hash) {
			var settings = parseHash(hash);
			this.contactRepository.setSenderId(settings.senderId);
			this.messageStorage.setSenderMessageId(settings.messageId);
			this.currentSkipAnswerAsync = this.requestedSkipAnswerAsync;
			this.mainMenuView.answerItemView.select();
		} else {
			this.currentSkipAnswerAsync = this.emptySkipAnswerAsync;
			this.mainMenuView.postcardItemView.select();
		}
	};
	MessengerApplication.prototype.initializeStartupData = function() {
		var self = this;
		
		VK.initAsync().then(function() {
			return self.contactRepository.initializeAsync();
		}).then(function() {
			var owner = self.contactRepository.owner;
			var vkId = Helpers.buildVkId(owner);
			return self.chatClientWrapper.connectAndLoginAsync(vkId);
		}).then(function() {
			return self.messageStorage.loadMessagesAsync();
		}).then(function() {
			self.answerPageView.setContact(self.contactRepository.sender);
			self.answerPageView.setMessage(self.messageStorage.getSenderMessage());
			self.preloadDialogView.hide();
			analytics.send('app_start', 'app_success');
		}).catch(function(error) {
			analytics.send('app_start', 'app_fail');
			console.error(error);
			alert('Приносим извенение. В настоящий момент в работе приложения наблюдаются проблемы. Возможно вы используете неподдерживаемый браузер. Установите Chrome, Opera, YaBrowser или Safari');
		});
	};

	var messengerApplication = new MessengerApplication();
};