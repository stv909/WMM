window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var MessageModel = messenger.models.MessageModel;
	var ContactModel = messenger.models.ContactModel;
	var MessageCollection = messenger.models.MessageCollection;

	var SelectPageView = messenger.views.SelectPageView;
	var EditPageView = messenger.views.EditPageView;
	var PostPageView = messenger.views.PostPageView;
	var AnswerPageView = messenger.views.AnswerPageView;
	var PostDialogView = messenger.views.PostDialogView;
	var SkipDialogView = messenger.views.SkipDialogView;
	var AskMessageDialogView = messenger.views.AskMessageDialogView;
	var PreloadDialogView = messenger.views.PreloadDialogView;
	var MessagePatternView = messenger.views.MessagePatternView;
	var ContactView = messenger.views.ContactView;

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

	var Storage = function() {
		Storage.super.apply(this);

		this.messages = {};
		this.currentMessage = null;

		this.owner = null;
		this.selectedContact = null;
		this.contacts = {};
		this.characters = [];
		
		this.contactOffset = 0;
		this.contactCount = 28;
		
		this.senderContactId = null;
	};
	Storage.super = EventEmitter;
	Storage.prototype = Object.create(EventEmitter.prototype);
	Storage.prototype.constructor = Storage;
	Storage.prototype.initializeAsync = function() {
		var loadCharactersPromise = this.loadCharactersAsync();
		var loadContactsPromise = this.loadContactsAsync();
		return Promise.all([loadCharactersPromise, loadContactsPromise]);
	};
	Storage.prototype.loadCharactersAsync = function() {
		var self = this;
		return async.requestAsync({
			url: 'https://bazelevshosting.net/MCM/characters_resources.json',
			method: 'GET',
			data: null
		}).then(function(rawData) {
			var response = JSON.parse(rawData);
			var characters = response.characters;
			for (var character in characters) {
				self.characters.push(character);
			}
			return true;
		});
	};
	Storage.prototype.loadFriendContactsAsync = function() {
		var self = this;
		return VK.apiAsync('friends.get', {
			user_id: self.owner.get('id'),
			count: self.contactCount,
			offset: self.contactOffset,
			v: 5.12
		}).then(function(response) {
			var userIds = response.items;
			var userCount = response.count;
			var currentUserCount = userIds.length;
			if (self.senderContactId) {
				userIds = userIds.filter(function(userId) {
					return userId !== self.senderContactId;	
				});
			}
			self.contactOffset += currentUserCount;
			if (self.contactOffset >= userCount) {
				self.trigger('end:contacts');
			}
			return VK.apiAsync('users.get', {
				user_ids: userIds.join(','),
				fields: ['photo_200', 'photo_100', 'photo_50'].join(','),
				name_case: 'nom',
				v: 5.12
			});
		}).then(function(response) {
			var vkContacts = response;
			vkContacts.forEach(function(vkContact) {
				var contact = ContactModel.fromVkData(vkContact);
				self.addContact(contact);
			});
			return true;
		});
	};
	Storage.prototype.loadContactsAsync = function() {
		var self = this;

		return VK.apiAsync('users.get', {
			fields: [ 'photo_200', 'photo_100', 'photo_50' ].join(','),
			name_case: 'nom',
			v: 5.12
		}).then(function(response) {
			var vkOwner = response[0];
			self.owner = ContactModel.fromVkData(vkOwner);
			self.owner.set({
				firstName: 'Я',
				lastName: '',
			});
			self.addContact(self.owner);
			return VK.apiAsync('friends.get', {
				user_id: self.owner.get('id'),
				count: self.contactCount,
				offset: self.contactOffset,
				v: 5.12
			});
		}).then(function(response) {
			var userIds = response.items;
			if (self.senderContactId) {
				userIds = userIds.filter(function(userId) {
					return userId !== self.senderContactId;	
				});
				userIds.unshift(self.senderContactId);
			}
			var userCount = response.count;
			self.contactOffset += userIds.length;
			if (userIds.length >= userCount) {
				self.trigger('end:contacts');
			}
			return VK.apiAsync('users.get', {
				user_ids: userIds.join(','),
				fields: ['photo_200', 'photo_100', 'photo_50'].join(','),
				name_case: 'nom',
				v: 5.12
			});
		}).then(function(response) {
			var vkContacts = response;
			vkContacts.forEach(function(vkContact) {
				var contact = ContactModel.fromVkData(vkContact);
				self.addContact(contact);
			});
			return true;
		});
	};
	Storage.prototype.hasContact = function(contactId) {
		return this.contacts.hasOwnProperty(contactId);
	};
	Storage.prototype.addContact = function(contact) {
		if (!this.hasContact(contact.get('id'))) {
			this.contacts[contact.get('id')] = contact;
			this.trigger({
				type: 'add:contact',
				contact: contact
			});
		}
	};
	Storage.prototype.removeContact = function(contactId) {
		if (this.hasContact(contactId)) {
			var contact = this.messages[contactId];
			delete this.contacts[contactId];
			this.trigger({
				type: 'remove:contact',
				contact: contact
			});
		}
	};
	Storage.prototype.getContactById = function(contactId) {
		return this.contacts[contactId];
	};
	Storage.prototype.getSenderContact = function() {
		return this.contacts[this.senderContactId] || this.owner;
	};
	Storage.prototype.getSenderContactId = function() {
		return this.senderContactId	|| this.owner.get('id');
	};
	
	var VKTools = function() {
		VKTools.super.apply(this);
	};
	VKTools.super = EventEmitter;
	VKTools.prototype = Object.create(EventEmitter.prototype);
	VKTools.prototype.constructor = VKTools;
	VKTools.prototype.calculateMessageShareUrl = function(messageId) {
		return [settings.shareMessageBaseUrl, messageId].join('');
	};
	VKTools.prototype.calculatePreviewUrl = function(fileName) {
		return [settings.imageStoreBaseUrl, fileName].join('');
	};
	VKTools.prototype.generatePreviewAsync = function(messageShareUrl) {
		var requestData = {
			url: messageShareUrl,
			imageFormat: 'png',
			scale: 1,
			contentType: 'share'
		};
		var rawRequestData = JSON.stringify(requestData);
		var options = {
			url: settings.previewGeneratorUrl,
			method: 'POST',
			data: 'type=render&data=' + encodeURIComponent(rawRequestData)
		};
		return async.requestAsync(options).then(function(rawData) {
			var response = JSON.parse(rawData);
			return response.image;
		});
	};
	VKTools.prototype.getWallUploadServerAsync = function() {
		var self = this;
		return VK.apiAsync('photos.getWallUploadServer', {
			v: 5.12
		}).then(function(response) {
			return response.upload_url;
		}, function(error) {
			alert(JSON.stringify(error));
		});
	};
	VKTools.prototype._checkVkDataError = function(data, errorMessage) {
		if (data.error) {
			throw new Error(errorMessage);
		}
	};
	VKTools.prototype.uploadImageAsync = function(uploadUri, imageUri) {
		var requestData = {
			uploadUrl: uploadUri,
			file1: imageUri
		};
		var options = {
			url: settings.imageUploadServiceUrl,
			method: 'POST',
			data: JSON.stringify(requestData)
		};
		return async.requestAsync(options);
	};
	VKTools.prototype.getUploadedFileId = function(response) {
		return ['photo', response[0].owner_id, '_', response[0].id].join('');
	};
	VKTools.prototype.createVkPost = function(message, ownerId, senderId, imageId, shareUrl) {
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
	};
	VKTools.prototype.wallPostAsync = function(postData) {
		return VK.apiAsync('wall.post', postData);
	};

	var MessengerApplication = function() {
		MessengerApplication.super.apply(this);
		var self = this;

		this.selectElem = document.getElementById('select');
		this.editElem = document.getElementById('edit');
		this.postElem = document.getElementById('post');

		this.pageElem = document.getElementById('page');
		this.pageContainerElem = document.getElementById('page-container');
		this.logoElem = document.getElementById('logo');
		this.nextElem = document.getElementById('next');

		this.navigation = new Navigation();
		this.storage = new Storage();
		this.chatClient = new ChatClient(settings.chatUrl);
		this.messageCollection = new MessageCollection(this.chatClient);
		this.vkTools = new VKTools();

		this.selectPageView = new SelectPageView();
		this.editPageView = new EditPageView();
		this.postPageView = new PostPageView();
		this.answerPageView = new AnswerPageView();
		this.postDialogView = new PostDialogView();
		this.skipDialogView = new SkipDialogView();
		this.preloadDialogView = new PreloadDialogView();
		this.askMessageDialogView = new AskMessageDialogView();

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

			var account = self.storage.owner;
			var companion = self.storage.selectedContact;
			var content = self.editPageView.getMessageContent();
			
			var message = MessageFactory.create(
				uuid.v4(),
				content,
				['vkid', account.get('id')].join(''),
				['vkid', companion.get('id')].join('')
			);

			var chatClientNowListener = function(event) {
				message.timestamp = event.response.now;
				self.chatClient.once('message:sent', chatClientSendListener);
				self.chatClient.once('message:send', chatClientSendListener);
				self.chatClient.sendMessage(message);
				self.postDialogView.setText('Сохрание сообщения...');
			};
			var chatClientSendListener = function(event) {
				self.chatClient.off('message:sent');
				self.chatClient.off('message:send');
				self.postDialogView.setText('Генерация превью...');

				self.vkTools.getWallUploadServerAsync().then(function(uploadUrl) {
					var shareMessageUrl = self.vkTools.calculateMessageShareUrl(message.id);
					var imageFileName = self.vkTools.generatePreviewAsync(shareMessageUrl);
					var values = [uploadUrl, imageFileName];
					return Promise.all(values);
				}).then(function(values) {
					self.postDialogView.setText('Загрузка превью изображения...');
					var uploadUrl = values[0];
					var previewUrl = self.vkTools.calculatePreviewUrl(values[1]);
					message.preview = values[1];
					self.chatClient.notifyMessage(message);
					return self.vkTools.uploadImageAsync(uploadUrl, previewUrl);
				}).then(function(rawData) {
					self.postDialogView.setText('Сохранение превью в альбоме...');
					var data = JSON.parse(rawData);
					data.v = 5.12
					return VK.apiAsync('photos.saveWallPhoto', data);
				}).then(function(response) {
					self.postDialogView.setText('Отправка сообщения на стену...');
					var imageId = self.vkTools.getUploadedFileId(response);
					var ownerId = companion.get('id');
					var senderId = account.get('id');
					var shareMessageUrl = self.vkTools.calculateMessageShareUrl(message.id);
					var postData = self.vkTools.createVkPost(message, ownerId, senderId, imageId, shareMessageUrl);
					return self.vkTools.wallPostAsync(postData);
				}).then(function() {
					self.postDialogView.setMode('complete');
				}).catch(function(error) {
					console.log(error);
					self.postDialogView.setMode('fail');
				});
			};

			self.chatClient.once('message:now', chatClientNowListener);
			self.chatClient.now();
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
		this.messageCollection.on('add:message', function(event) {
			var message = event.message;
			var first = event.first;
			var messagePatternView = new MessagePatternView(message);
			self.selectPageView.addMessagePatternView(messagePatternView, first);
		});
		this.messageCollection.on('select:message', function(event) {
			var message = event.message;
			self.editPageView.setMessage(message);
		});
		this.messageCollection.on('preload:update', function(event) {
			var count = event.count;
			self.selectPageView.setPreloadedMessageCount(count);
		});
		this.storage.on('add:contact', function(event) {
			var contact = event.contact;
			var contactView = new ContactView(contact);
			self.postPageView.addContactView(contactView);
		});
		this.storage.on('end:contacts', function(event) {
			self.postPageView.hideContactLoading();	
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
			self.messageCollection.selectMessage(message);
		});
		this.selectPageView.on('click:load', function(event) {
			self.selectPageView.disableMessageLoading();
			self.messageCollection.loadMessagesAsync().then(function() {
				self.selectPageView.enableMessageLoading();
				//html.scrollToBottom(self.pageElem);
			}).catch(function(error) {
				console.log(error);
				self.selectPageView.enableMessageLoading();
			});
		});
		this.selectPageView.on('click:preload', function(event) {
			self.messageCollection.appendPreloadedMessages();	
		});
		this.postDialogView.on('click:close', function(event) {
			if (self.currentLogoElemClickListener === self.logoElemAnswerClickListener) {
				self.postPageView.setContact(self.storage.owner.get('id'));
				self.logoElem.removeEventListener('click', self.logoElemAnswerClickListener);
				self.logoElem.addEventListener('click', self.logoElemStandardClickListener);
				self.currentLogoElemClickListener = self.logoElemStandardClickListener;
				window.location.hash = '';
			}
			self.navigation.setMode('select');
		});
		this.skipDialogView.on('click:ok', function(event) {
			self.postPageView.setContact(self.storage.owner.get('id'));
			self.logoElem.removeEventListener('click', self.logoElemAnswerClickListener);
			self.logoElem.addEventListener('click', self.logoElemStandardClickListener);
			self.currentLogoElemClickListener = self.logoElemStandardClickListener;
			window.location.hash = '';
			self.navigation.setMode('select');
		});
		this.postPageView.on('select:contact', function(event) {
			self.storage.selectedContact = event.contact;
		});
		this.postPageView.on('click:load', function() {
			self.postPageView.disableContactLoading();
			self.storage.loadFriendContactsAsync().then(function() {
				self.postPageView.enableContactLoading();
				html.scrollToBottom(self.pageElem);
			}).catch(function() {
				self.postPageView.enableContactLoading();	
			});
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
			this.storage.senderContactId = settings.senderId;
			this.messageCollection.setSenderMessageId(settings.messageId);
		} else {
			this.navigation.setMode('select');
			this.logoElem.addEventListener('click', this.logoElemStandardClickListener);
			this.currentLogoElemClickListener = this.logoElemStandardClickListener;
		}
	};
	MessengerApplication.prototype.initializeStartupData = function() {
		var self = this;
		VK.initAsync().then(function() {
			return self.storage.initializeAsync();
		}).then(function(values) {
			self.editPageView.setCharacters(self.storage.characters);

			self.chatClient.once('connect', function() {
				var account = self.storage.owner;
				var vkId = ['vkid', account.get('id')].join('');
				self.chatClient.login(vkId);
			});
			self.chatClient.once('message:login', function() {
				self.messageCollection.loadMessagesAsync()
				.then(function() {
					self.answerPageView.setContact(self.storage.getSenderContact());
					self.answerPageView.setMessage(self.messageCollection.getSenderMessage());
					self.selectPageView.setMessage(self.messageCollection.getSenderMessageId());
					self.postPageView.setSpecialContact(self.storage.owner.get('id'));
					self.postPageView.setContact(self.storage.getSenderContactId());
					self.preloadDialogView.hide();
				}).catch(function(error) {
					console.log(error);
					self.preloadDialogView.hide();
				});
			});

			self.chatClient.connect();

		}).catch(function(error) {
			console.log(error);
			self.preloadDialogView.hide();
		});
	};

	var messengerApplication = new MessengerApplication();
};