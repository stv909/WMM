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
	var PreloadDialogView = messenger.views.PreloadDialogView;
	var MessagePatternView = messenger.views.MessagePatternView;
	var ContactView = messenger.views.ContactView;

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
	Storage.prototype.loadContactsAsync = function() {
		var self = this;
		var settings = VK.access.FRIENDS | VK.access.PHOTOS;
		return VK.Auth.loginAsync(settings).then(function(session) {
			var userId = session.mid;
			return VK.Api.callAsync('users.get', {
				user_ids: [ userId ],
				fields: [ 'photo_200', 'photo_100', 'photo_50' ],
				name_case: 'nom',
				v: 5.11
			});
		}).then(function(data) {
			var vkOwner = data.response[0];
			self.owner = ContactModel.fromVkData(vkOwner);
			self.addContact(self.owner);
			return VK.Api.callAsync('friends.get', {
				user_id: self.owner.get('id'),
				v: 5.11
			});
		}).then(function(data) {
			var userIds = data.response.items;
			userIds.length = 100;
			return VK.Api.callAsync('users.get', {
				user_ids: userIds,
				fields: [ 'photo_200', 'photo_100', 'photo_50' ],
				name_case: 'nom',
				v: 5.11
			});
		}).then(function(data) {
			var vkContacts = data.response;
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

	var MessengerApplication = function() {
		MessengerApplication.super.apply(this);
		var self = this;

		this.selectElem = document.getElementById('select');
		this.editElem = document.getElementById('edit');
		this.postElem = document.getElementById('post');

		this.pageContainerElem = document.getElementById('page-container');
		this.logoElem = document.getElementById('logo');
		this.nextElem = document.getElementById('next');

		this.navigation = new Navigation();
		this.storage = new Storage();

		this.selectPageView = new SelectPageView();
		this.editPageView = new EditPageView();
		this.postPageView = new PostPageView();
		this.answerPageView = new AnswerPageView();
		this.postDialogView = new PostDialogView();
		this.skipDialogView = new SkipDialogView();
		this.preloadDialogView = new PreloadDialogView();

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
			console.log(self.storage.selectedContact);
			self.postDialogView.show();
		};
		this.nextElemAnswerClickListener = function(event) {
			self.navigation.setMode('select');
		};

		this.initializeVk();
		this.initializeStorage();
		this.initializeViews();
		this.initializeNavigation();
		this.initializeSettings();
		this.initializeStartupData();
	};
	MessengerApplication.super = EventEmitter;
	MessengerApplication.prototype = Object.create(EventEmitter.prototype);
	MessengerApplication.prototype.constructor = MessengerApplication;
	MessengerApplication.prototype.initializeVk = function() {
		VK.init({
			apiId: 4170375
		});
	};
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
				self.logoElem.removeEventListener('click', self.logoElemAnswerClickListener);
				self.logoElem.addEventListener('click', self.logoElemStandardClickListener);
				self.currentLogoElemClickListener = self.logoElemStandardClickListener;
				window.location.hash = '';
			}
			self.navigation.setMode('select');
		});

		this.skipDialogView.on('click:ok', function(event) {
			self.logoElem.removeEventListener('click', self.logoElemAnswerClickListener);
			self.logoElem.addEventListener('click', self.logoElemStandardClickListener);
			self.currentLogoElemClickListener = self.logoElemStandardClickListener;
			window.location.hash = '';
			self.navigation.setMode('select');
		});
		
		this.postPageView.on('select:contact', function(event) {
			self.storage.selectedContact = event.contact;
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
	};
	MessengerApplication.prototype.initializeSettings = function() {
		var hash = window.location.hash;
		if (hash) {
			this.navigation.setMode('answer');
			this.logoElem.addEventListener('click', this.logoElemAnswerClickListener);
			this.currentLogoElemClickListener = this.logoElemAnswerClickListener;
		} else {
			this.navigation.setMode('select');
			this.logoElem.addEventListener('click', this.logoElemStandardClickListener);
			this.currentLogoElemClickListener = this.logoElemStandardClickListener;
		}
	};
	MessengerApplication.prototype.initializeStartupData = function() {
		var self = this;
		this.preloadDialogView.show();
		this.storage.initializeAsync().then(function() {
			self.editPageView.setCharacters(self.storage.characters);
			self.postPageView.setSpecialContact(self.storage.owner.get('id'));

			var message1 = new MessageModel();
			var message2 = new MessageModel();
	
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
			
			self.storage.addMessage(message1);
			self.storage.addMessage(message2);
			self.preloadDialogView.hide();
		}).catch(function() {
			self.preloadDialogView.hide();
		});
	};

	var messengerApplication = new MessengerApplication();
};