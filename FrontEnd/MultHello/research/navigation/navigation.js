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
		contactModel.set('firstName', 'Уолтер');
		contactModel.set('lastName', 'White');
		contactModel.set('photo', 'http://cs412123.vk.me/v412123262/7e84/g42XLZAjpac.jpg');
		var contactView = new ContactView(contactModel);
		postPageView.addContactView(contactView);
	}

	navigation.setMode('select');
	logoElem.addEventListener('click', logoElemClickListener);
//	var hash = window.location.hash;
//	if (hash) {
//		alert(hash);
//	}
};