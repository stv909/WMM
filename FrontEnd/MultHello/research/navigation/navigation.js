window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var MessageModel = messenger.models.MessageModel;
	var ContactModel = messenger.models.ContactModel;

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
		this.senderMessageId = '7520357e-dbf9-4f58-e934-c86ff7204e96';
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
	Storage.prototype.hasMessage = function(messageId) {
		return this.messages.hasOwnProperty(messageId);
	};
	Storage.prototype.addMessage = function(message) {
		if (!this.hasMessage(message.get('id'))) {
			this.messages[message.get('id')] = message;
			this.trigger({
				type: 'add:message',
				message: message
			});
		}
	};
	Storage.prototype.removeMessage = function(messageId) {
		if (this.hasMessage(messageId)) {
			var message = this.messages[messageId];
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				message: message
			});
		}
	};
	Storage.prototype.selectMessage = function(message) {
		this.currentMessage = message;
		this.trigger({
			type: 'select:message',
			message: this.currentMessage
		});
	};
	Storage.prototype.getMessageById = function(messageId) {
		return this.messages[messageId];
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
	Storage.prototype.getSenderMessage = function() {
		return this.messages[this.senderMessageId] || this.messages[Object.keys(this.messages)[0]];
	};
	Storage.prototype.getSenderMessageId = function() {
		return this.senderMessageId || Object.keys(this.messages)[0];
	};

	var VKTools = function() {
		VKTools.super.apply(this);
	};
	VKTools.super = EventEmitter;
	VKTools.prototype = Object.create(EventEmitter.prototype);
	VKTools.prototype.constructor = VKTools;
	VKTools.prototype.calculateMessageShareUrl = function(messageId) {
		return ['https://c9.io/stv909/wmm/workspace/FrontEnd/templates/share.html?ids=msg.', messageId].join('');
	};
	VKTools.prototype.calculatePreviewUrl = function(fileName) {
		return ['http://www.bazelevscontent.net:8582/', fileName].join('');
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
			url: 'https://www.bazelevscontent.net:8893',
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
			url: 'https://wmm-c9-stv909.c9.io',
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
		var appUrl = 'vk.com/app4214902';
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
		this.chatClient = new ChatClient('ws://www.bazelevscontent.net:9009/');
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
		this.storage.on('add:message', function(event) {
			var message = event.message;
			var messagePatternView = new MessagePatternView(message);
			self.selectPageView.addMessagePatternView(messagePatternView);
		});
		this.storage.on('select:message', function(event) {
			var message = event.message;
			self.editPageView.setMessage(message);
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
			self.storage.selectMessage(message);
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
			this.storage.senderMessageId = this.storage.senderMessageId || settings.messageId;
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
				var msgId = ['msg', self.storage.senderMessageId].join('.');
				self.chatClient.retrieve([msgId].join(','));
			});
			self.chatClient.once('message:retrieve', function(event) {
				var retrieve = event.response.retrieve;
				var message = MessageModel.fromChatMessage(retrieve[0]);
				self.storage.addMessage(message);
				
				var message1 = new MessageModel();
				var message2 = new MessageModel();
				var message3 = new MessageModel();
		
				message1.set({
					id: 1,
					preview: 'https://www.bazelevscontent.net:8583/8b8cdae3-8842-4ecd-a067-ccda2cfe56f8.png',
					content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(https://lh6.googleusercontent.com/-pDyo6bISP5s/UwXAANbCjXI/AAAAAAAAFus/rbcJ2tUev7g/w448-h328-no/office_dresscode_2_back.png); background-size: auto; width: 403px; height: 403px; background-position: 0% 21%; background-repeat: no-repeat no-repeat;"><div class="tool_layerItem_ece920e7-b59b-4c00-9cc5-b4d093fd8a1a layerType_text" draggable="true" style="font-family: Impact; font-size: 1.9em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 5; left: 9px; top: 339px; -webkit-transform: rotate(0deg);">И НЕ НАДЕЛ ГАЛСТУК НА РАБОТУ</div><div class="tool_layerItem_cdd13bc9-151d-463a-bff7-f8f6f1f978a5 layerType_text" draggable="true" style="font-family: Impact; font-size: 1.5em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 4; left: 60px; top: 11px; -webkit-transform: rotate(0deg);">РЕШИЛ БЫТЬ САМИМ СОБОЙ</div><img src="https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;borac&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;happy&lt;/mood&gt;&lt;action&gt;point&lt;/action&gt;Ай эм секси энд ай ноу ит!&lt;gag&gt;party&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif&quot;}" class="tool_layerItem_5025a450-13c9-40a4-8410-94a1a1d30628 layerType_actor" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(0.5133420832795046) rotate(0deg); left: 96px; top: -87px; pointer-events: auto;"><img src="https://lh5.googleusercontent.com/-eI04EqemiLY/UwXAC7AICAI/AAAAAAAAFvU/_2AnZWHqjvs/w448-h328-no/office_dresscode_2_front.png" class="tool_layerItem_ff203327-3bd4-46a8-a0bc-98c5e38b342e layerType_img" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(1) rotate(0deg); left: -25px; top: 16px;"><img src="https://lh3.googleusercontent.com/--kaLl9jd890/UwXfgRqfPGI/AAAAAAAAFx0/qACqaTb0MjA/s403-no/7.png" class="tool_layerItem_312b95b5-4b85-4fea-b464-29510fc69ee9 layerType_img" draggable="true" style="position: absolute; z-index: 3; -webkit-transform: scale(1) rotate(0deg); left: 0px; top: 0px;"><div class="tool_layerItem_0cfd1126-2616-4977-808d-01e2201f258f layerType_text" draggable="true" style="font-family: Impact; font-size: 1em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 6; -webkit-transform: rotate(0deg); left: 107px; top: 376px;">НУ МОЖЕТ НЕ ТОЛЬКО ГАЛСТУК</div></div>'
				});
				message2.set({
					id: 2,
					preview: 'https://www.bazelevscontent.net:8583/6f2d89b3-ac7d-42ff-853b-e249e635303f.png',
					content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(http://bm.img.com.ua/img/prikol/images/large/0/7/116670_182525.jpg); background-size: cover; width: 403px; height: 403px; background-position: 0% 0%; background-repeat: no-repeat no-repeat;"><img src="https://www.bazelevscontent.net:8583/cda3b406-3284-4336-9339-72e2780c665b_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;ostap&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;action&gt;point&lt;/action&gt;&#1076;&#1077;&#1083;&#1072;&#1081; &#1088;&#1072;&#1079;&lt;action&gt;rulez&lt;/action&gt;&#1076;&#1077;&#1083;&#1072;&#1081; &#1076;&#1074;&#1072;&lt;action&gt;applaud&lt;/action&gt;&#1076;&#1077;&#1083;&#1072;&#1081; &#1090;&#1088;&#1080;!&lt;gag&gt;party&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/cda3b406-3284-4336-9339-72e2780c665b_1.gif&quot;}" class="tool_layerItem_0b421ad0-382c-403a-bbed-6060240b9985 layerType_actor" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(0.5) rotate(0deg); left: -30px; top: 0px;"><img src="https://www.bazelevscontent.net:8583/5b384968-e77e-4533-a659-931c9edac410_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;2&quot;,&quot;character&quot;:&quot;joe&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;2&lt;/actor&gt;&lt;action&gt;hi&lt;/action&gt;&#1087;&#1088;&#1080;&#1074;&#1077;&#1090;!&lt;action&gt;sucks&lt;/action&gt;&#1075;&#1088;&#1091;&#1089;&#1090;&#1080;&#1096;&#1100;?&lt;gag&gt;laugh&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/5b384968-e77e-4533-a659-931c9edac410_1.gif&quot;}" class="tool_layerItem_46f88be7-c16f-4b5c-90c1-209b004f4f61 layerType_actor" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(0.4) rotate(0deg); left: 150px; top: -50px;"><div class="tool_layerItem_b67357c7-deda-4bf5-956b-1f6b68038e8e layerType_text" draggable="true" style="font-size: 3em; color: white; background-color: transparent; text-shadow: black -1.5px 0px 3px, black 0px -1.5px 3px, black 1.5px 0px 3px, black 0px 1.5px 3px, black -1.5px -1.5px 3px, black 1.5px 1.5px 3px, black -1.5px 1.5px 3px, black 1.5px -1.5px 3px; pointer-events: auto; position: absolute; z-index: 3; -webkit-transform: rotate(0deg);">где-то в глубинке...</div><div class="tool_layerItem_711ab108-6852-428e-89f7-5c39d46106cb layerType_text" draggable="true" style="font-size: 1.7em; color: rgb(244, 164, 96); background-color: transparent; text-shadow: black -1.5px 0px 3px, black 0px -1.5px 3px, black 1.5px 0px 3px, black 0px 1.5px 3px, black -1.5px -1.5px 3px, black 1.5px 1.5px 3px, black -1.5px 1.5px 3px, black 1.5px -1.5px 3px; pointer-events: auto; position: absolute; z-index: 4; left: 50px; top: 50px; -webkit-transform: rotate(0deg);">южный парк по-русски</div></div>'
				});
				message3.set({
					id: 3,
					preview: 'https://www.bazelevscontent.net:8583/47ae760b-582e-4b85-9189-5e352968d1aa.png',
					content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(http://cs616923.vk.me/v616923054/86/4m-Qeb8onF0.jpg); background-size: auto; width: 403px; height: 403px; background-position: 39% 0%; background-repeat: no-repeat no-repeat;"><div class="tool_layerItem_1afdf61d-4285-4a9f-9799-77f9e0e6bc23 layerType_text" draggable="true" style="font-family: Impact, Charcoal, sans-serif; font-size: 28px; color: black; background-color: transparent; text-shadow: red -1px 0px 2px, red 0px -1px 2px, red 1px 0px 2px, red 0px 1px 2px, red -1px -1px 2px, red 1px 1px 2px, red -1px 1px 2px, red 1px -1px 2px; text-align: center; pointer-events: auto; position: absolute; z-index: 3; left: 162px; top: 177px; -webkit-transform: rotate(0deg);">Всем привет из Дели! Всем привет из Дели! Всем привет из Дели! Всем привет из Дели!</div><img src="http://cs419227.vk.me/u16996461/75628422/s_3370ea06dbx:001.jpg" class="tool_layerItem_504c1a6f-2b62-4282-95b4-9d8eea365261 layerType_img" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(2.0505460456750133) rotate(0deg); left: 258px; top: -17px;"><img src="https://www.bazelevscontent.net:8583/f08251fa-53b4-4ac6-8a21-204e0427de36_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;swann&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;anger&lt;/mood&gt;&lt;action&gt;point&lt;/action&gt;балет уже не тот&lt;gag&gt;facepalm&lt;/gag&gt;&lt;gag&gt;cry&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/f08251fa-53b4-4ac6-8a21-204e0427de36_1.gif&quot;}" class="tool_layerItem_321c8291-e176-45ba-a954-b8faecb27cc9 layerType_actor" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(0.5688000922764596) rotate(0deg); left: -73px; top: -10px;"><div class="tool_layerItem_66540590-88a0-4bd1-bd60-dc0843f61a3d layerType_text" draggable="true" style="font-size: 32px; color: black; background-color: white; text-align: center; pointer-events: auto; position: absolute; z-index: 4; left: 0px; top: -4px; -webkit-transform: rotate(0deg);">Тестовая карточка!</div></div>'
				});
				
				self.storage.addMessage(message1);
				self.storage.addMessage(message2);
				self.storage.addMessage(message3);
				
				self.selectPageView.setMessage(self.storage.getSenderMessageId());
				self.postPageView.setSpecialContact(self.storage.owner.get('id'));
				self.postPageView.setContact(self.storage.getSenderContactId());
				self.answerPageView.setContact(self.storage.getSenderContact());
				self.answerPageView.setMessage(self.storage.getSenderMessage());
				self.preloadDialogView.hide();
			});

			self.chatClient.connect();

		}).catch(function(error) {
			console.log(error);
			self.preloadDialogView.hide();
		});
	};

	var messengerApplication = new MessengerApplication();
};