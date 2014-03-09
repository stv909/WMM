window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var MessageModel = messenger.models.MessageModel;
	var ContactModel = messenger.models.ContactModel;
	var MessageCollection = messenger.models.MessageCollection;
	
	var ContactStorage = messenger.storage.ContactStorage;
	var CharacterStorage = messenger.storage.CharacterStorage;
	var MessageStorage = messenger.storage.MessageStorage;

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
	var ContactView = messenger.views.ContactView;
	
	var VkTools = messenger.utils.VkTools;
	var ChatClientWrapper = messenger.utils.ChatClientWrapper;
	var Helpers = messenger.utils.Helpers;

	var ChatClient = chat.ChatClient;
	var MessageFactory = chat.MessageFactory;

	var Navigation = function() {
		Navigation.super.apply(this);
		this.mode = null;
	};
	Navigation.super = EventEmitter;
	Navigation.prototype = Object.create(EventEmitter.prototype);
	Navigation.prototype.constructor = Navigation;
	Navigation.prototype.setMode = function(mode) {
		if (this.mode !== mode) {
			this.mode = mode;
			this.trigger({
				type: 'mode',
				mode: this.mode
			});
			this.trigger({
				type: ['mode', mode].join(':')
			});
		}
	};
	Navigation.prototype.getNextMode = function() {
		if (this.mode === 'select') {
			return 'edit';
		} else if (this.mode === 'edit') {
			return 'post';
		} else if (this.mode === 'post') {
			return 'select';
		} else if (this.mode === 'answer') {
			return 'select';
		}
	};

	var MessengerApplication = function() {
		MessengerApplication.super.apply(this);
		var self = this;

		this.selectElem = document.getElementById('select');
		this.editElem = document.getElementById('edit');
		this.postElem = document.getElementById('post');
		this.onlineElem = document.getElementById('online');
		this.disconnectElem = document.getElementById('disconnect');

		this.pageElem = document.getElementById('page');
		this.pageContainerElem = document.getElementById('page-container');
		this.logoElem = document.getElementById('logo');
		this.nextElem = document.getElementById('next');

		this.navigation = new Navigation();
		this.chatClient = new ChatClient(settings.chatUrl);
		this.chatClientWrapper = new ChatClientWrapper(this.chatClient);
		
		this.messageStorage = new MessageStorage(this.chatClientWrapper);
		this.contactStorage = new ContactStorage();
		this.characterStorage = new CharacterStorage();

		this.selectPageView = new SelectPageView();
		this.editPageView = new EditPageView();
		this.postPageView = new PostPageView();
		this.answerPageView = new AnswerPageView();
		this.postDialogView = new PostDialogView();
		this.skipDialogView = new SkipDialogView();
		this.preloadDialogView = new PreloadDialogView();
		this.askMessageDialogView = new AskMessageDialogView();
		this.errorDialogView = new ErrorDialogView();

		this.currentLogoElemClickListener = null;
		this.logoElemStandardClickListener = function(event) {
			self.navigation.setMode('select');
		};
		this.logoElemAnswerClickListener = function(event) {
			self.skipDialogView.show();
		};

		this.selectElemClickListener = function(event) {
			self.navigation.setMode('select');
		};
		this.editElemClickListener = function(event) {
			self.navigation.setMode('edit');
		};
		this.postElemClickListener = function(event) {
			self.navigation.setMode('post');
		};

		this.currentNextElemClickListener = null;
		this.nextElemStandardClickListener = function(event) {
			self.navigation.setMode(self.navigation.getNextMode());
		};
		this.nextElemPostClickListener = function(event) {
			self.postDialogView.show();

			var account = self.contactStorage.owner;
			var companion = self.contactStorage.selected;
			var content = self.editPageView.getMessageContent();
			var message = MessageFactory.create(
				uuid.v4(),
				content,
				Helpers.buildVkId(account),
				Helpers.buildVkId(companion)
			);
			var shareMessageUrl = VkTools.calculateMessageShareUrl(message.id);
			
			self.chatClientWrapper.nowAsync().then(function(timestamp) {
				self.postDialogView.setText('Сохрание сообщения...');
				message.timestamp = timestamp;
				return self.chatClientWrapper.sendMessageAsync(message);
			}).then(function() {
				self.postDialogView.setText('Генерация превью...');
				return VkTools.getWallPhotoUploadUrlAsync();
			}).then(function(uploadUrl) {
				return VkTools.generatePreviewAsync(shareMessageUrl, uploadUrl);
			}).then(function(response) {
				self.postDialogView.setText('Сохранение превью в альбоме...');
				var uploadResult = response.uploadResult;
				var image = response.image;
				message.preview = image;
				self.chatClient.notifyMessage(message);
				uploadResult.v = 5.12;
				return VK.apiAsync('photos.saveWallPhoto', uploadResult);
			}).then(function(response) {
				self.postDialogView.setText('Отправка сообщения на стену...');
				var imageId = VkTools.getUploadedFileId(response);
				var ownerId = companion.get('id');
				var senderId = account.get('id');
				var postData = VkTools.createVkPost(message, ownerId, senderId, imageId, shareMessageUrl);
				return VK.apiAsync('wall.post', postData);
			}).then(function() {
				self.postDialogView.setMode('complete');
			}).catch(function(error) {
				self.postDialogView.setMode('fail');
				console.error(error);
			});
		};
		this.nextElemAnswerClickListener = function(event) {
			self.navigation.setMode('select');
		};
		
		this.currentShowAskMessageDialog = null;
		this.validShowAskMessageDialog = function() {
			self.askMessageDialogView.trigger('click:ok');
		};
		this.invalidShowAskMessageDialog = function() {
			self.askMessageDialogView.show();
		};

		this.preloadDialogView.show();
		this.initializeStorage();
		this.initializeChatClient();
		this.initializeViews();
		this.initializeNavigation();
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
		
		this.contactStorage.on('update:search', function(event) {
			self.postPageView.clear();
			self.postPageView.showContactLoading();
			var contacts = event.contacts;
			contacts.on('paginate:item', function(event) {
				var contact = event.item;
				self.postPageView.showContact(contact);
			});
			contacts.on('paginate:end', function(event) {
				self.postPageView.hideContactLoading();	
			});
			contacts.next();
		});
		this.characterStorage.on('update:characters', function(event) {
			var charactersArray = event.charactersArray;
			var characters = event.characters;
			self.editPageView.setCharacters(characters);
		});
	};
	MessengerApplication.prototype.initializeChatClient = function() {
		var self = this;
		this.chatClient.on('disconnect', function() {
			self.onlineElem.textContent = 'не в сети';
			self.onlineElem.classList.add('invalid');
			self.chatClient.once('connect', function() {
				var owner = self.contactStorage.owner;
				var ownerId = owner.get('id');
				var vkId = ['vkid', ownerId].join('');
				self.chatClient.login(vkId);
			});
			self.chatClient.connect();
		});
		this.chatClient.on('message:login', function() {
			self.onlineElem.textContent = 'в сети';
			self.onlineElem.classList.remove('invalid');
		});
		this.disconnectElem.addEventListener('click', function() {
			self.chatClient.disconnect();
		});
	};
	MessengerApplication.prototype.initializeViews = function() {
		var self = this;

		this.selectPageView.attachTo(this.pageContainerElem);
		this.editPageView.attachTo(this.pageContainerElem);
		this.postPageView.attachTo(this.pageContainerElem);
		this.answerPageView.attachTo(this.pageContainerElem);

		this.selectPageView.on('select:message', function(event) {
			var message = event.message;
			self.messageStorage.selectMessage(message);
		});
		this.selectPageView.on('click:load', function(event) {
			self.selectPageView.disableMessageLoading();
			self.messageStorage.loadMessagesAsync().catch(function(error) {
				self.errorDialogView.show(error);
			}).fin(function() {
				self.selectPageView.enableMessageLoading();
			});
		});
		this.selectPageView.on('click:preload', function(event) {
			self.messageStorage.appendPreloadedMessages();	
		});
		this.postDialogView.on('click:close', function(event) {
			if (self.currentLogoElemClickListener === self.logoElemAnswerClickListener) {
				self.postPageView.selectContact(self.contactStorage.owner);
				self.logoElem.removeEventListener('click', self.logoElemAnswerClickListener);
				self.logoElem.addEventListener('click', self.logoElemStandardClickListener);
				self.currentLogoElemClickListener = self.logoElemStandardClickListener;
				window.location.hash = '';
			}
			self.navigation.setMode('select');
		});
		this.skipDialogView.on('click:ok', function(event) {
			self.postPageView.selectContact(self.contactStorage.owner);
			self.logoElem.removeEventListener('click', self.logoElemAnswerClickListener);
			self.logoElem.addEventListener('click', self.logoElemStandardClickListener);
			self.currentLogoElemClickListener = self.logoElemStandardClickListener;
			window.location.hash = '';
			self.navigation.setMode('select');
		});
		this.postPageView.on('select:contact', function(event) {
			self.contactStorage.selected = event.contact;
		});
		this.postPageView.on('click:load', function() {
			self.contactStorage.searchCollection.next();
		});
		this.postPageView.on('update:search', function(event) {
			self.contactStorage.search(event.text);	
		});
		this.editPageView.on('status:validate', function() {
			self.currentShowAskMessageDialog = self.validShowAskMessageDialog;
		});
		this.editPageView.on('status:invalidate', function() {
			self.currentShowAskMessageDialog = self.invalidShowAskMessageDialog;
		});
		this.askMessageDialogView.on('click:ok', function(event) {
			self.editPageView.reset();
			
			self.selectElem.classList.add('normal');
			self.selectElem.classList.remove('chosen');
			self.selectElem.addEventListener('click', self.selectElemClickListener);

			self.editElem.classList.add('normal');
			self.editElem.classList.remove('chosen');
			self.editElem.addEventListener('click', self.editElemClickListener);

			self.postElem.classList.remove('normal');
			self.postElem.classList.add('chosen');
			self.postElem.removeEventListener('click', self.postElemClickListener);

			self.selectPageView.hide();
			self.editPageView.hide();
			self.postPageView.show();
			self.answerPageView.hide();

			self.nextElem.textContent = 'Отправить сообщение';
			self.nextElem.removeEventListener('click', self.currentNextElemClickListener);
			self.nextElem.addEventListener('click', self.nextElemPostClickListener);
			self.currentNextElemClickListener = self.nextElemPostClickListener;
		});
		this.askMessageDialogView.on('click:cancel', function(event) {
			self.navigation.setMode('edit');
		});
	};
	MessengerApplication.prototype.initializeNavigation = function() {
		var self = this;

		this.navigation.on('mode:answer', function(event) {
			self.selectElem.classList.add('hidden');
			self.selectElem.classList.add('normal');
			self.selectElem.classList.remove('chosen');
			self.selectElem.addEventListener('click', self.selectElemClickListener);

			self.editElem.classList.add('hidden');
			self.editElem.classList.add('normal');
			self.editElem.classList.remove('chosen');
			self.editElem.addEventListener('click', self.editElemClickListener);

			self.postElem.classList.add('hidden');
			self.postElem.classList.add('normal');
			self.postElem.classList.remove('chosen');
			self.postElem.addEventListener('click', self.postElemClickListener);

			self.selectPageView.hide();
			self.editPageView.hide();
			self.postPageView.hide();
			self.answerPageView.show();

			self.skipDialogView.setText('Вы уверены, что не хотите ответить на сообщение?');

			self.nextElem.textContent = 'Ответить';
			self.nextElem.removeEventListener('click', self.currentNextElemClickListener);
			self.nextElem.addEventListener('click', self.nextElemAnswerClickListener);
			self.currentNextElemClickListener = self.nextElemAnswerClickListener;
		});
		this.navigation.on('mode:select', function(event) {
			self.selectElem.classList.remove('hidden');
			self.selectElem.classList.remove('normal');
			self.selectElem.classList.add('chosen');
			self.selectElem.removeEventListener('click', self.selectElemClickListener);

			self.editElem.classList.remove('hidden');
			self.editElem.classList.add('normal');
			self.editElem.classList.remove('chosen');
			self.editElem.addEventListener('click', self.editElemClickListener);

			self.postElem.classList.remove('hidden');
			self.postElem.classList.add('normal');
			self.postElem.classList.remove('chosen');
			self.postElem.addEventListener('click', self.postElemClickListener);

			self.selectPageView.show();
			self.editPageView.hide();
			self.postPageView.hide();
			self.answerPageView.hide();

			self.nextElem.textContent = 'Далее';
			self.nextElem.removeEventListener('click', self.currentNextElemClickListener);
			self.nextElem.addEventListener('click', self.nextElemStandardClickListener);
			self.currentNextElemClickListener = self.nextElemStandardClickListener;
		});
		this.navigation.on('mode:edit', function(event) {
			self.selectElem.classList.add('normal');
			self.selectElem.classList.remove('chosen');
			self.selectElem.addEventListener('click', self.selectElemClickListener);

			self.editElem.classList.remove('normal');
			self.editElem.classList.add('chosen');
			self.editElem.removeEventListener('click', self.editElemClickListener);

			self.postElem.classList.add('normal');
			self.postElem.classList.remove('chosen');
			self.postElem.addEventListener('click', self.postElemClickListener);

			self.selectPageView.hide();
			self.editPageView.show();
			self.postPageView.hide();
			self.answerPageView.hide();

			self.nextElem.textContent = 'Далее';
			self.nextElem.removeEventListener('click', self.currentNextElemClickListener);
			self.nextElem.addEventListener('click', self.nextElemStandardClickListener);
			self.currentNextElemClickListener = self.nextElemStandardClickListener;
		});
		this.navigation.on('mode:post', function(event) {
			self.currentShowAskMessageDialog();
		});
	};
	MessengerApplication.prototype.initializeSettings = function() {
		var parseHash = function(hash) {
			var settings = {};
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
			this.navigation.setMode('answer');
			this.logoElem.addEventListener('click', this.logoElemAnswerClickListener);
			this.currentLogoElemClickListener = this.logoElemAnswerClickListener;
			
			var settings = parseHash(hash);
			this.contactStorage.setSenderId(settings.senderId);
			this.messageStorage.setSenderMessageId(settings.messageId);
		} else {
			this.navigation.setMode('select');
			this.logoElem.addEventListener('click', this.logoElemStandardClickListener);
			this.currentLogoElemClickListener = this.logoElemStandardClickListener;
		}
	};
	MessengerApplication.prototype.initializeStartupData = function() {
		var self = this;
		
		VK.initAsync().then(function() {
			var contactStoragePromise = self.contactStorage.initializeAsync();
			var characterStoragePromise = self.characterStorage.initializeAsync();
			var promises = [contactStoragePromise, characterStoragePromise];
			return Q.all(promises);
		}).then(function() {
			var owner = self.contactStorage.owner;
			var vkId = Helpers.buildVkId(owner);
			return self.chatClientWrapper.connectAndLoginAsync(vkId);
		}).then(function() {
			return self.messageStorage.loadMessagesAsync();
		}).then(function() {
			self.answerPageView.setContact(self.contactStorage.getSender());
			self.answerPageView.setMessage(self.messageStorage.getSenderMessage());
		}).catch(function(error) {
			console.error(error);
		}).fin(function() {
			self.preloadDialogView.hide();
		});
	};

	var messengerApplication = new MessengerApplication();
};