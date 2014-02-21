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
		}
	};

	var MessagePatternView = function() {
		MessagePatternView.super.apply(this);
		var self = this;

		this.activeImageUrl = 'giphy.gif';
		this.passiveImageUrl = 'giphy.jpg';
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
		this.imageElem.src = this.activeImageUrl;
	};
	MessagePatternView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.imageElem.src = this.passiveImageUrl;
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

	var selectPageView = new SelectPageView();
	var editPageView = new EditPageView();
	var postPageView = new PostPageView();
	var postDialogView = new PostDialogView();

	selectPageView.attachTo(pageContainerElem);
	editPageView.attachTo(pageContainerElem);
	postPageView.attachTo(pageContainerElem);

	var navigation = new Navigation();

	postDialogView.on('click:close', function(event) {
		navigation.setMode('select');
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

	var messagePatternView1 = new MessagePatternView();
	var messagePatternView2 = new MessagePatternView();
	var messagePatternView3 = new MessagePatternView();
	var messagePatternView4 = new MessagePatternView();
	var messagePatternView5 = new MessagePatternView();
	var messagePatternView6 = new MessagePatternView();
	var messagePatternView7 = new MessagePatternView();
	var messagePatternView8 = new MessagePatternView();

	selectPageView.addMessagePatternView(messagePatternView1);
	selectPageView.addMessagePatternView(messagePatternView2);
	selectPageView.addMessagePatternView(messagePatternView3);
	selectPageView.addMessagePatternView(messagePatternView4);
	selectPageView.addMessagePatternView(messagePatternView5);
	selectPageView.addMessagePatternView(messagePatternView6);
	selectPageView.addMessagePatternView(messagePatternView7);
	selectPageView.addMessagePatternView(messagePatternView8);

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

	navigation.setMode('select');
	logoElem.addEventListener('click', logoElemClickListener);
//	var hash = window.location.hash;
//	if (hash) {
//		alert(hash);
//	}
};