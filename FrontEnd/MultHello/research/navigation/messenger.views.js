var messenger = messenger || {};

(function(messenger, abyss, template) {

	var View = abyss.View;

	var SelectPageView = function() {
		SelectPageView.super.apply(this);
		var self = this;

		this.elem = template.create('select-page-template', { id: 'select-page' });
		this.patternsElem = this.elem.getElementsByClassName('patterns')[0];
		this.selectedMessageView = null;

		this.messagePatternSelectListener = function(event) {
			var target = event.target;
			var message = event.message;
			if (target !== self.selectedMessageView) {
				if (self.selectedMessageView) {
					self.selectedMessageView.deselect();
				}
				self.selectedMessageView = target;
				self.trigger({
					type: 'select:message',
					message: message
				});
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
	SelectPageView.prototype.addMessagePatternView = function(messageView) {
		messageView.attachTo(this.patternsElem);
		messageView.on('select', this.messagePatternSelectListener);
		if (!this.selectedMessageView) {
			messageView.select();
		}
	};

	var EditPageView = function() {
		EditPageView.super.apply(this);
		var self = this;

		this.elem = template.create('edit-page-template', { id: 'edit-page' });
		this.messageWrapperElem = this.elem.getElementsByClassName('message-wrapper')[0];

		this.messageEditorView = new MessageEditorView();
		this.messageEditorView.attachTo(this.messageWrapperElem);

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
	EditPageView.prototype.setMessage = function(message) {
		this.messageEditorView.setModel(message);
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

	var AnswerPageView = function() {
		AnswerPageView.super.apply(this);
		var self = this;

		this.elem = template.create('answer-page-template', { id: 'answer-page' });
		//this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.messageWrapperElem = this.elem.getElementsByClassName('message-wrapper')[0];
		this.contactWrapElem = this.elem.getElementsByClassName('contact-wrapper')[0];

		this.messageEditorView = new MessageEditorView();
		this.messageEditorView.attachTo(this.messageWrapperElem);

		this.contactView = new ContactView();
		this.contactView.attachTo(this.contactWrapElem);
		this.contactView.select();

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
	AnswerPageView.prototype.setContact = function(contact) {
		this.contactView.setModel(contact);
	};
	AnswerPageView.prototype.setMessage = function(message) {
		this.messageEditorView.setModel(message);
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

	var MessageView = function(model) {
		MessageView.super.apply(this);

		this.model = model;
		this.elem = template.create('message-template', { className: 'message' });
		this.contentElem = this.elem.getElementsByClassName('content')[0];

		this.selected = false;
	};
	MessageView.super = View;
	MessageView.prototype = Object.create(View.prototype);
	MessageView.prototype.constructor = MessageView;
	MessageView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
		this.removeCachedElem();
		this.addCachedElem(this.cachedFullElem);
		this.trigger({
			type: 'select',
			message: this.model
		});
	};
	MessageView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.removeCachedElem();
		this.addCachedElem(this.cachedPreviewElem);
	};
	MessageView.prototype.addCachedElem = function(cachedElem) {
		this.cachedElem = cachedElem;
		this.contentElem.appendChild(cachedElem);
	};
	MessageView.prototype.removeCachedElem = function() {
		if (this.cachedElem) {
			this.contentElem.removeChild(this.cachedElem);
		}
	};
	MessageView.prototype.prepareCachedPreviewElem = function() {
		this.cachedPreviewElem = document.createElement('div');
		var imgElem = document.createElement('img');
		imgElem.src = this.model.get('preview');
		this.cachedPreviewElem.appendChild(imgElem);
	};
	MessageView.prototype.prepareCachedFullElem = function() {
		this.cachedFullElem = document.createElement('div');
		this.cachedFullElem.innerHTML = this.model.get('content');
	};
	MessageView.prototype.setModel = function(model) {
		this.model = model;
		this.removeCachedElem();
		this.prepareCachedPreviewElem();
		this.prepareCachedFullElem();
		if (this.selected) {
			this.addCachedElem(this.cachedFullElem);
		} else {
			this.addCachedElem(this.cachedPreviewElem);
		}
	};

	var MessagePatternView = function(model) {
		MessagePatternView.super.apply(this, arguments);
		var self = this;

		this.prepareCachedPreviewElem();
		this.prepareCachedFullElem();
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.select();
			}
		};

		this.elem.addEventListener('click', elemClickListener, this);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	MessagePatternView.super = MessageView;
	MessagePatternView.prototype = Object.create(MessageView.prototype);
	MessagePatternView.prototype.constructor = MessagePatternView;

	var MessageEditorView = function() {
		MessageEditorView.super.apply(this);

		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
	};
	MessageEditorView.super = MessageView;
	MessageEditorView.prototype = Object.create(MessageView.prototype);
	MessageEditorView.prototype.constructor = MessageEditorView;

	var ContactView = function(model) {
		ContactView.super.apply(this);
		var self = this;

		this.elem = template.create('contact-template', { className: 'contact' });
		this.photoElem = this.elem.getElementsByClassName('photo')[0];
		this.firstNameElem = this.elem.getElementsByClassName('first-name')[0];
		this.lastNameElem = this.elem.getElementsByClassName('last-name')[0];

		this.selected = false;
		this.setModel(model);
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
	ContactView.prototype.setModel = function(model) {
		if (model) {
			this.model = model;
			this.photoElem.src = this.model.get('photo');
			this.firstNameElem.textContent = this.model.get('firstName');
			this.lastNameElem.textContent = this.model.get('lastName');
		}
	};

	messenger.views = {
		SelectPageView: SelectPageView,
		EditPageView: EditPageView,
		PostPageView: PostPageView,
		AnswerPageView: AnswerPageView,
		PostDialogView: PostDialogView,
		MessageView: MessageView,
		MessagePatternView: MessagePatternView,
		ContactView: ContactView
	};

})(messenger, abyss, template);