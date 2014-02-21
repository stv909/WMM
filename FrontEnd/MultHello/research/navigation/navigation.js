window.onload = function() {
	var EventEmitter = eve.EventEmitter;
	var View = abyss.View;
	var Model = abyss.Model;

	var selectElem = document.getElementById('select');
	var editElem = document.getElementById('edit');
	var postElem = document.getElementById('post');

	var pageContainerElem = document.getElementById('page-container');
	var logoElem = document.getElementById('logo');
	var nextElem = document.getElementById('next');

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

	var MessageModel = function() {
		MessageModel.super.apply(this);
		var self = this;
	};
	MessageModel.super = Model;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;

	var MessagePatternView = function(model) {
		MessagePatternView.super.apply(this);
		var self = this;

		this.model = model;
		this.elem = template.create('message-pattern-template', { className: 'message-pattern' });
		this.imageElem = this.elem.getElementsByClassName('image')[0];

		this.selected = false;
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.trigger('select');
				self.select();
			}
		};

		this.elem.addEventListener('click', elemClickListener, this);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	MessagePatternView.super = View;
	MessagePatternView.prototype = Object.create(View.prototype);
	MessagePatternView.prototype.constructor = MessagePatternView;
	MessagePatternView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
		this.imageElem.innerHTML = this.model.get('content');
	};
	MessagePatternView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.imageElem.innerHTML = this.model.get('preview');
	};

	var SelectPageView = function() {
		SelectPageView.super.apply(this);
		var self = this;

		this.elem = template.create('select-page-template', { id: 'select-page' });
		this.patternsElem = this.elem.getElementsByClassName('patterns')[0];
		this.selectedMessagePatternView = null;

		this.messagePatternSelectListener = function(event) {
			var target = event.target;
			if (target !== self.selectedMessagePatternView) {
				if (self.selectedMessagePatternView) {
					self.selectedMessagePatternView.deselect();
				}
				self.selectedMessagePatternView = target;
			}
		};

		this.hide();
	};
	SelectPageView.super = View;
	SelectPageView.prototype = Object.create(View.prototype);
	SelectPageView.prototype.constructor = SelectPageView;
	SelectPageView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	SelectPageView.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};
	SelectPageView.prototype.addMessagePatternView = function(messagePatternView) {
		messagePatternView.attachTo(this.patternsElem);
		messagePatternView.on('select', this.messagePatternSelectListener);
		if (!this.selectedMessagePatternView) {
			this.selectedMessagePatternView = messagePatternView;
			this.selectedMessagePatternView.select();
		}
	};

	var EditPageView = function() {
		EditPageView.super.apply(this);
		var self = this;

		this.elem = template.create('edit-page-template', { id: 'edit-page' });
		this.messageContainer = this.elem.getElementsByClassName('message-container')[0];

		this.hide();
	};
	EditPageView.super = View;
	EditPageView.prototype = Object.create(View.prototype);
	EditPageView.prototype.constructor = EditPageView;
	EditPageView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	EditPageView.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};
	EditPageView.prototype.setMessageContent = function(messageContent) {
		this.messageContainer.innerHTML = messageContent;
	};

	var PostPageView = function() {
		PostPageView.super.apply(this);
		var self = this;

		this.elem = template.create('post-page-template', { id: 'post-page' });
		this.contactsElem = this.elem.getElementsByClassName('contacts')[0];
		this.specialContactElem = this.elem.getElementsByClassName('special-contact')[0];
		this.selectedContactView = null;

		this.contactViewSelectListener = function(event) {
			var target = event.target;
			if (target !== self.selectedContactView) {
				if (self.selectedContactView) {
					self.selectedContactView.deselect();
				}
				self.selectedContactView = target;
			}
		};

		this.hide();
	};
	PostPageView.super = View;
	PostPageView.prototype = Object.create(View.prototype);
	PostPageView.prototype.constructor = PostPageView;
	PostPageView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	PostPageView.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};
	PostPageView.prototype.addContactView = function(contactView, special) {
		if (special) {
			contactView.attachTo(this.specialContactElem);
		} else {
			contactView.attachTo(this.contactsElem);
		}
		contactView.on('select', this.contactViewSelectListener);
		if (!this.selectedContactView) {
			this.selectedContactView = contactView;
			this.selectedContactView.select();
		}
	};

	var PostDialogView = function() {
		PostDialogView.super.apply(this);
		var self = this;

		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = this.elem.getElementsByClassName('dialog-window')[0];
		this.readyElem = this.elem.getElementsByClassName('ready')[0];

		var readyElemClickListener = function(event) {
			self.hide();
			self.trigger('click:close');
		};

		this.readyElem.addEventListener('click', readyElemClickListener);

		this.once('dispose', function() {
			self.readyElem.removeEventListener('click', readyElemClickListener);
		});
	};
	PostDialogView.super = View;
	PostDialogView.prototype = Object.create(View.prototype);
	PostDialogView.prototype.constructor = PostDialogView;
	PostDialogView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	PostDialogView.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};

	var MessageModel = function() {
		MessageModel.super.apply(this);
		var self = this;
	};
	MessageModel.super = Model;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;

	var ContactModel = function() {
		ContactModel.super.apply(this);
	};
	ContactModel.super = Model;
	ContactModel.prototype = Object.create(Model.prototype);
	ContactModel.prototype.constructor = ContactModel;
	ContactModel.fromVkData = function(rawData) {
		var id = rawData.id;
		var firstName = rawData.first_name;
		var lastName = rawData.last_name;
		var photo = rawData.photo_200;
		var contact = new ContactModel();
		contact.set({
			id: id,
			firstName: firstName,
			lastName: lastName,
			photo: photo
		});
		return contact;
	};

	var ContactView = function(model) {
		ContactView.super.apply(this);
		var self = this;

		this.model = model;
		this.elem = template.create('contact-template', { className: 'contact' });
		this.photoElem = this.elem.getElementsByClassName('photo')[0];
		this.firstNameElem = this.elem.getElementsByClassName('first-name')[0];
		this.lastNameElem = this.elem.getElementsByClassName('last-name')[0];

		this.photoElem.src = this.model.get('photo');
		this.firstNameElem.textContent = this.model.get('firstName');
		this.lastNameElem.textContent = this.model.get('lastName');

		this.selected = false;
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.trigger('select');
				self.select();
			}
		};

		this.elem.addEventListener('click', elemClickListener, this);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	ContactView.super = View;
	ContactView.prototype = Object.create(View.prototype);
	ContactView.prototype.constructor = ContactView;
	ContactView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.remove('normal');
		this.elem.classList.add('chosen');
	};
	ContactView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.add('normal');
		this.elem.classList.remove('chosen');
	};

	var AnswerPageView = function() {
		AnswerPageView.super.apply(this);
		var self = this;

		this.elem = template.create('answer-page-template', { id: 'answer-page' });
		this.hide();
	};
	AnswerPageView.super = View;
	AnswerPageView.prototype = Object.create(View.prototype);
	AnswerPageView.prototype.constructor = AnswerPageView;
	AnswerPageView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	AnswerPageView.prototype.hide = function() {
		this.elem.classList.add('hidden');
	};

	var Storage = function() {
		Storage.super.apply(this);
		this.messages = {};
	};
	Storage.super = EventEmitter;
	Storage.prototype = Object.create(EventEmitter.prototype);
	Storage.prototype.constructor = Storage;
	Storage.prototype.addMessage = function(message) {
		this.messages[message.get('id')] = message;
		this.trigger({
			type: 'add:message',
			message: message
		});
	};
	Storage.prototype.removeMessage = function(messageId) {
		var message = this.messages[messageId];
		if (message) {
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				message: message
			});
		}
	};

	var selectPageView = new SelectPageView();
	var editPageView = new EditPageView();
	var postPageView = new PostPageView();
	var answerPageView = new AnswerPageView();
	var postDialogView = new PostDialogView();

	selectPageView.attachTo(pageContainerElem);
	editPageView.attachTo(pageContainerElem);
	postPageView.attachTo(pageContainerElem);
	answerPageView.attachTo(pageContainerElem);

	var storage = new Storage();
	storage.on('add:message', function(event) {
		var message = event.message;
		var messagePatternView = new MessagePatternView(message);
		selectPageView.addMessagePatternView(messagePatternView);
	});

	var message1 = new MessageModel();
	var message2 = new MessageModel();

	message1.set({
		id: 1,
		preview: '<img src="https://www.bazelevscontent.net:8583/3709a40f-8d30-40bf-a261-ff1ebdc8ba56.png">',
		content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(https://lh6.googleusercontent.com/-pDyo6bISP5s/UwXAANbCjXI/AAAAAAAAFus/rbcJ2tUev7g/w448-h328-no/office_dresscode_2_back.png); background-size: auto; width: 403px; height: 403px; background-position: 0% 21%; background-repeat: no-repeat no-repeat;"><div class="tool_layerItem_ece920e7-b59b-4c00-9cc5-b4d093fd8a1a layerType_text" draggable="true" style="font-family: Impact; font-size: 1.9em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 5; left: 9px; top: 339px; -webkit-transform: rotate(0deg);">И НЕ НАДЕЛ ГАЛСТУК НА РАБОТУ</div><div class="tool_layerItem_cdd13bc9-151d-463a-bff7-f8f6f1f978a5 layerType_text" draggable="true" style="font-family: Impact; font-size: 1.5em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 4; left: 60px; top: 11px; -webkit-transform: rotate(0deg);">РЕШИЛ БЫТЬ САМИМ СОБОЙ</div><img src="https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;borac&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;happy&lt;/mood&gt;&lt;action&gt;point&lt;/action&gt;Ай эм секси энд ай ноу ит!&lt;gag&gt;party&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/12fa62f1-8492-4d33-bb88-bc0914501aeb_1.gif&quot;}" class="tool_layerItem_5025a450-13c9-40a4-8410-94a1a1d30628 layerType_actor" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(0.5133420832795046) rotate(0deg); left: 96px; top: -87px; pointer-events: auto;"><img src="https://lh5.googleusercontent.com/-eI04EqemiLY/UwXAC7AICAI/AAAAAAAAFvU/_2AnZWHqjvs/w448-h328-no/office_dresscode_2_front.png" class="tool_layerItem_ff203327-3bd4-46a8-a0bc-98c5e38b342e layerType_img" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(1) rotate(0deg); left: -25px; top: 16px;"><img src="https://lh3.googleusercontent.com/--kaLl9jd890/UwXfgRqfPGI/AAAAAAAAFx0/qACqaTb0MjA/s403-no/7.png" class="tool_layerItem_312b95b5-4b85-4fea-b464-29510fc69ee9 layerType_img" draggable="true" style="position: absolute; z-index: 3; -webkit-transform: scale(1) rotate(0deg); left: 0px; top: 0px;"><div class="tool_layerItem_0cfd1126-2616-4977-808d-01e2201f258f layerType_text" draggable="true" style="font-family: Impact; font-size: 1em; color: black; background-color: transparent; text-shadow: none; pointer-events: auto; position: absolute; z-index: 6; -webkit-transform: rotate(0deg); left: 107px; top: 376px;">НУ МОЖЕТ НЕ ТОЛЬКО ГАЛСТУК</div></div>'
	});
	message2.set({
		id: 2,
		preview: '',
		content: '<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(http://bm.img.com.ua/img/prikol/images/large/0/7/116670_182525.jpg); background-size: cover; width: 403px; height: 403px; background-position: 0% 0%; background-repeat: no-repeat no-repeat;"><img src="https://www.bazelevscontent.net:8583/cda3b406-3284-4336-9339-72e2780c665b_1.gif" data-meta="&lt;actor&gt;ostap&lt;/actor&gt;&lt;action&gt;point&lt;/action&gt;делай раз&lt;action&gt;rulez&lt;/action&gt;делай два&lt;action&gt;applaud&lt;/action&gt;делай три!&lt;gag&gt;party&lt;/gag&gt;" class="tool_layerItem_0b421ad0-382c-403a-bbed-6060240b9985 layerType_actor" draggable="true" style="position: absolute; z-index: 1; -webkit-transform: scale(0.5) rotate(0deg); left: -30px; top: 0px; -webkit-filter: invert(25%);"><img src="https://www.bazelevscontent.net:8583/5b384968-e77e-4533-a659-931c9edac410_1.gif" data-meta="&lt;actor&gt;joe&lt;/actor&gt;&lt;action&gt;hi&lt;/action&gt;привет!&lt;action&gt;sucks&lt;/action&gt;грустишь?&lt;gag&gt;laugh&lt;/gag&gt;" class="tool_layerItem_46f88be7-c16f-4b5c-90c1-209b004f4f61 layerType_actor" draggable="true" style="position: absolute; z-index: 2; -webkit-transform: scale(0.4) rotate(0deg); left: 150px; top: -50px;"><div class="tool_layerItem_b67357c7-deda-4bf5-956b-1f6b68038e8e layerType_text" draggable="true" style="font-size: 3em; color: white; background-color: transparent; text-shadow: black -1.5px 0px 3px, black 0px -1.5px 3px, black 1.5px 0px 3px, black 0px 1.5px 3px, black -1.5px -1.5px 3px, black 1.5px 1.5px 3px, black -1.5px 1.5px 3px, black 1.5px -1.5px 3px; pointer-events: auto; position: absolute; z-index: 3; -webkit-transform: rotate(0deg);">где-то в глубинке...</div><div class="tool_layerItem_711ab108-6852-428e-89f7-5c39d46106cb layerType_text" draggable="true" style="font-size: 1.7em; color: rgb(244, 164, 96); background-color: transparent; text-shadow: black -1.5px 0px 3px, black 0px -1.5px 3px, black 1.5px 0px 3px, black 0px 1.5px 3px, black -1.5px -1.5px 3px, black 1.5px 1.5px 3px, black -1.5px 1.5px 3px, black 1.5px -1.5px 3px; pointer-events: auto; position: absolute; z-index: 4; left: 50px; top: 50px; -webkit-transform: rotate(0deg);">южный парк по-русски</div></div>'
	});

	storage.addMessage(message1);
	storage.addMessage(message2);

	var navigation = new Navigation();

	postDialogView.on('click:close', function(event) {
		navigation.setMode('select');
	});

	navigation.on('mode:answer', function(event) {
		selectPageView.hide();
		editPageView.hide();
		postPageView.hide();
		answerPageView.show();

		nextElem.textContent = 'Ответить';
		nextElem.removeEventListener('click', currentNextElemClickListener);
		nextElem.addEventListener('click', nextElemStandardClickListener);
		currentNextElemClickListener = nextElemStandardClickListener;
	});
	navigation.on('mode:select', function(event) {
		selectElem.classList.remove('normal');
		selectElem.classList.add('chosen');
		selectElem.removeEventListener('click', selectElemClickListener);

		editElem.classList.add('normal');
		editElem.classList.remove('chosen');
		editElem.addEventListener('click', editElemClickListener);

		postElem.classList.add('normal');
		postElem.classList.remove('chosen');
		postElem.addEventListener('click', postElemClickListener);

		selectPageView.show();
		editPageView.hide();
		postPageView.hide();
		answerPageView.hide();

		nextElem.textContent = 'Далее';
		nextElem.removeEventListener('click', currentNextElemClickListener);
		nextElem.addEventListener('click', nextElemStandardClickListener);
		currentNextElemClickListener = nextElemStandardClickListener;
	});
	navigation.on('mode:edit', function(event) {
		selectElem.classList.add('normal');
		selectElem.classList.remove('chosen');
		selectElem.addEventListener('click', selectElemClickListener);

		editElem.classList.remove('normal');
		editElem.classList.add('chosen');
		editElem.removeEventListener('click', editElemClickListener);

		postElem.classList.add('normal');
		postElem.classList.remove('chosen');
		postElem.addEventListener('click', postElemClickListener);

		selectPageView.hide();
		editPageView.show();
		postPageView.hide();
		answerPageView.hide();

		nextElem.textContent = 'Далее';
		nextElem.removeEventListener('click', currentNextElemClickListener);
		nextElem.addEventListener('click', nextElemStandardClickListener);
		currentNextElemClickListener = nextElemStandardClickListener;
	});
	navigation.on('mode:post', function(event) {
		selectElem.classList.add('normal');
		selectElem.classList.remove('chosen');
		selectElem.addEventListener('click', selectElemClickListener);

		editElem.classList.add('normal');
		editElem.classList.remove('chosen');
		editElem.addEventListener('click', editElemClickListener);

		postElem.classList.remove('normal');
		postElem.classList.add('chosen');
		postElem.removeEventListener('click', postElemClickListener);

		selectPageView.hide();
		editPageView.hide();
		postPageView.show();
		answerPageView.hide();

		nextElem.textContent = 'Отправить сообщение';
		nextElem.removeEventListener('click', currentNextElemClickListener);
		nextElem.addEventListener('click', nextElemPostClickListener);
		currentNextElemClickListener = nextElemPostClickListener;
	});

	var logoElemClickListener = function(event) {
		navigation.setMode('select');
	};
	var selectElemClickListener = function(event) {
		navigation.setMode('select');
	};
	var editElemClickListener = function(event) {
		navigation.setMode('edit');
	};
	var postElemClickListener = function(event) {
		navigation.setMode('post');
	};

	var currentNextElemClickListener = null;
	var nextElemStandardClickListener = function(event) {
		navigation.setMode(navigation.getNextMode());
	};
	var nextElemPostClickListener = function(event) {
		postDialogView.show();
	};

	var specialContactModel = new ContactModel();
	specialContactModel.set('id', 1);
	specialContactModel.set('firstName', 'Я');
	specialContactModel.set('lastName', '');
	specialContactModel.set('photo', 'http://cs312916.vk.me/v312916973/6bb0/AlCfNObM--0.jpg');
	var specialContactView = new ContactView(specialContactModel);
	postPageView.addContactView(specialContactView, true);

	for (var i = 2; i < 52; i++) {
		var contactModel = new ContactModel();
		contactModel.set('id', i);
		contactModel.set('firstName', 'Walter');
		contactModel.set('lastName', 'White');
		contactModel.set('photo', 'http://cs412123.vk.me/v412123262/7e84/g42XLZAjpac.jpg');
		var contactView = new ContactView(contactModel);
		postPageView.addContactView(contactView);
	}

	editPageView.setMessageContent('<div class="tool_layerBackground" style="position: relative; overflow: hidden; background-image: url(http://bm.img.com.ua/img/prikol/images/large/0/7/116670_182525.jpg); background-size: cover; width: 403px; height: 403px; background-position: 0% 21%; background-repeat: no-repeat no-repeat;"><div class="tool_layerItem_ece920e7-b59b-4c00-9cc5-b4d093fd8a1a layerType_text" draggable="true" style="font-size: 3em; color: white; background-color: transparent; text-shadow: black -1.5px 0px 3px, black 0px -1.5px 3px, black 1.5px 0px 3px, black 0px 1.5px 3px, black -1.5px -1.5px 3px, black 1.5px 1.5px 3px, black -1.5px 1.5px 3px, black 1.5px -1.5px 3px; pointer-events: auto; position: absolute; z-index: 1; -webkit-transform: rotate(0deg); left: 6px; top: 1px;">где-то в глубинке...</div><div class="tool_layerItem_cdd13bc9-151d-463a-bff7-f8f6f1f978a5 layerType_text" draggable="true" style="font-size: 1.7em; color: rgb(244, 164, 96); background-color: transparent; text-shadow: black -1.5px 0px ...f&quot;}" class="tool_layerItem_c262c846-3ff0-44db-914d-4ae1067f07a5 layerType_actor" draggable="true" style="position: absolute; z-index: 3; -webkit-transform: scale(0.5403600876626364) rotate(0deg); left: -28px; top: -19px;"><img src="https://www.bazelevscontent.net:8583/08b6e413-ff75-4625-b7e3-e7b936f469d9_1.gif" data-meta="{&quot;actors&quot;:[{&quot;name&quot;:&quot;1&quot;,&quot;character&quot;:&quot;joe&quot;}],&quot;commands&quot;:&quot;&lt;actor&gt;1&lt;/actor&gt;&lt;mood&gt;happy&lt;/mood&gt; &lt;action&gt;hi&lt;/action&gt; привет! &lt;action&gt;sucks&lt;/action&gt; грустишь? &lt;gag&gt;laugh&lt;/gag&gt;&quot;,&quot;type&quot;:&quot;dialog&quot;,&quot;url&quot;:&quot;https://www.bazelevscontent.net:8583/08b6e413-ff75-4625-b7e3-e7b936f469d9_1.gif&quot;}" class="tool_layerItem_5025a450-13c9-40a4-8410-94a1a1d30628 layerType_actor" draggable="true" style="position: absolute; z-index: 4; -webkit-transform: scale(0.44012666865176525) rotate(0deg); left: 153px; top: -46px;"></div>');


	logoElem.addEventListener('click', logoElemClickListener);
	var hash = window.location.hash;
	if (hash) {
		navigation.setMode('answer');
	} else {
		navigation.setMode('select');
	}
};