var messenger = messenger || {};

(function(messenger, abyss, template) {

	var View = abyss.View;

	var SelectPageView = function() {
		SelectPageView.super.apply(this);
		var self = this;

		this.elem = template.create('select-page-template', { id: 'select-page' });
		this.patternsElem = this.elem.getElementsByClassName('patterns')[0];
		this.selectedMessageView = null;
		this.messageViews = {};

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
		var message = messageView.model;
		var messageId = message.get('id');
		this.messageViews[messageId] = messageView;
		messageView.on('select', this.messagePatternSelectListener);
		if (!this.selectedMessageView) {
			messageView.select();
		}
	};

	var EditPageView = function() {
		EditPageView.super.apply(this);
		var self = this;

		this.elem = template.create('edit-page-template', { id: 'edit-page' });
		this.resetElem = this.elem.getElementsByClassName('reset')[0];
		this.updateElem = this.elem.getElementsByClassName('update')[0];
		this.messageWrapperElem = this.elem.getElementsByClassName('message-wrapper')[0];
		this.memosElem = this.elem.getElementsByClassName('memos')[0];
		this.characterCollectionElem = this.elem.getElementsByClassName('character-collection')[0];

		this.messageEditorView = new MessageEditorView();
		this.messageEditorView.attachFirstTo(this.messageWrapperElem);

		this.updateMessageDialogView = new UpdateMessageDialogView();
		this.updateMessageDialogView.on('click:close', function() {

		});

		this.characters = null;
		this.characterViewCollection = [];

		this.messageEditorView.on('change:content', function(event) {
			var elem = event.elem;
			self.clear();
			self._parseLayerTypeText(elem);
			self._parseLayerTypeActor(elem);
		});
		this.resetElem.addEventListener('click', function() {
			self.characterViewCollection.forEach(function(view) {
				view.reset();
			})
		});
		this.updateElem.addEventListener('click', function() {
			self.updateMessageDialogView.show();
		});

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
	EditPageView.prototype.clear = function() {
		this.characterViewCollection.forEach(function(view) {
			view.dispose();
		});
		this.memosElem.innerHTML = '';
		this.characterCollectionElem.innerHTML = '';
		this.characterViewCollection = [];
	};
	EditPageView.prototype._parseLayerTypeText = function(rootElem) {
		var textElements = rootElem.getElementsByClassName('layerType_text');
		for (var i = 0; i < textElements.length; i++) {
			this._createTextElem(textElements[i]);
		}
	};
	EditPageView.prototype._createTextElem = function(layerTextElem) {
		var elem = document.createElement('input');

		elem.className = 'text';
		elem.type = 'text';
		elem.value = layerTextElem.textContent;

		elem.addEventListener('input', function() {
			layerTextElem.textContent = elem.value;
		});

		this.memosElem.appendChild(elem);
	};
	EditPageView.prototype._parseLayerTypeActor = function(rootElem) {
		var actorElements = rootElem.getElementsByClassName('layerType_actor');
		for (var i = 0; i < actorElements.length; i++) {
			this._createCharacterView(actorElements[i]);
		}
	};
	EditPageView.prototype._createCharacterView = function(layerActorElem) {
		var rawMeta = layerActorElem.dataset.meta;
		var meta = JSON.parse(rawMeta);
		var self = this;
		console.log(meta);

		var layerId = layerActorElem.className.split(' ')[0];
		var phrases = [];
		var hints = [];
		var commands = meta.commands;

		var startPos = commands.indexOf('</', startPos);
		var endPos = 0;
		while(startPos >= 0)
		{
			startPos = commands.indexOf('>', startPos) + 1;
			if (startPos > 0)
			{
				var end = commands.indexOf('<', startPos);
				if (end === -1)
					end = commands.length;
				if (startPos > 0 && end > startPos)
				{
					hints.push(commands.substring(endPos, startPos));
					phrases.push(commands.substring(startPos, end));
					endPos = end;
				}
			}
			startPos = commands.indexOf('</', startPos);
		}
		hints.push(commands.substring(endPos, commands.length));

		var characterData = {
			layerId: layerId,
			actors: meta.actors,
			phrases: phrases,
			hints: hints,
			type: meta.type
		};

		console.log(characterData);

		var characterView = new CharacterView(this.characters);
		characterView.attachTo(this.characterCollectionElem);
		characterView.on('validate', function() {
			if (self.isValid()) {
				self.updateElem.classList.add('hidden');
				self.resetElem.classList.add('hidden');
			} else {
				self.updateElem.classList.remove('hidden');
				self.resetElem.classList.remove('hidden');
			}
		});
		characterView.on('invalidate', function() {
			if (self.isValid()) {
				self.updateElem.classList.add('hidden');
				self.resetElem.classList.add('hidden');
			} else {
				self.updateElem.classList.remove('hidden');
				self.resetElem.classList.remove('hidden');
			}
		});
		this.characterViewCollection.push(characterView);
	};
	EditPageView.prototype.isValid = function() {
		var valid = true;
		for (var i = 0; i < this.characterViewCollection.length; i++) {
			valid = this.characterViewCollection[i].isValid();
			if (!valid) {
				break;
			}
		}
		return valid;
	};
	EditPageView.prototype.validate = function() {
		this.characterViewCollection.forEach(function(view) {
			view.validate();
		});
	};
	EditPageView.prototype.reset = function() {
		this.characterViewCollection.forEach(function(view) {
			view.reset();
		})
	};
	EditPageView.prototype.setCharacters = function(characters) {
		this.characters = characters;
	};

	var PostPageView = function() {
		PostPageView.super.apply(this);
		var self = this;

		this.elem = template.create('post-page-template', { id: 'post-page' });
		this.contactsElem = this.elem.getElementsByClassName('contacts')[0];
		this.specialContactElem = this.elem.getElementsByClassName('special-contact')[0];
		this.selectedContactView = null;
		this.contactViews = {};

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
		var contact = contactView.model;
		var contactId = contact.get('id');
		this.contactViews[contactId] = contactView;
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

	var SkipDialogView = function() {
		SkipDialogView.super.apply(this);
		var self = this;

		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('skip-answer-dialog');
		this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];
		this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];
		this.answerTextElem = this.dialogWindowElem.getElementsByClassName('answer-text')[0];

		var okElemClickListener = function(event) {
			self.hide();
			self.trigger('click:ok');
		};
		var cancelElemClickListener = function(event) {
			self.hide();
			self.trigger('click:cancel');
		};

		this.okElem.addEventListener('click', okElemClickListener);
		this.cancelElem.addEventListener('click', cancelElemClickListener);

		this.once('dispose', function(event) {
			this.okElem.removeEventListener('click', okElemClickListener);
			this.cancelElem.removeEventListener('click', cancelElemClickListener);
		});
	};
	SkipDialogView.super = View;
	SkipDialogView.prototype = Object.create(View.prototype);
	SkipDialogView.prototype.constructor = SkipDialogView;
	SkipDialogView.prototype.show = function() {
		this.dialogWindowElem.classList.remove('hidden');
		this.elem.classList.remove('hidden');
	};
	SkipDialogView.prototype.hide = function() {
		this.dialogWindowElem.classList.add('hidden');
		this.elem.classList.add('hidden');
	};
	SkipDialogView.prototype.setText = function(text) {
		this.answerTextElem.textContent = text;
	};

	var PostDialogView = function() {
		PostDialogView.super.apply(this);
		var self = this;

		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('post-dialog');
		this.readyElem = this.dialogWindowElem.getElementsByClassName('ready')[0];

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
		this.dialogWindowElem.classList.remove('hidden');
		this.elem.classList.remove('hidden');
	};
	PostDialogView.prototype.hide = function() {
		this.dialogWindowElem.classList.add('hidden');
		this.elem.classList.add('hidden');
	};

	var UpdateMessageDialogView = function() {
		UpdateMessageDialogView.super.apply(this);
		var self = this;

		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('update-message-dialog');
		this.readyElem = this.dialogWindowElem.getElementsByClassName('ready')[0];

		var readyElemClickListener = function(event) {
			self.hide();
			self.trigger('click:close');
		};

		this.readyElem.addEventListener('click', readyElemClickListener);

		this.once('dispose', function() {
			self.readyElem.removeEventListener('click', readyElemClickListener);
		});
	};
	UpdateMessageDialogView.super = View;
	UpdateMessageDialogView.prototype = Object.create(View.prototype);
	UpdateMessageDialogView.prototype.constructor = UpdateMessageDialogView;
	UpdateMessageDialogView.prototype.show = function() {
		this.dialogWindowElem.classList.remove('hidden');
		this.elem.classList.remove('hidden');
	};
	UpdateMessageDialogView.prototype.hide = function() {
		this.dialogWindowElem.classList.add('hidden');
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
	MessageEditorView.prototype.setModel = function(model) {
		MessageEditorView.super.prototype.setModel.apply(this, arguments);
		this.trigger({
			type: 'change:content',
			elem: this.cachedFullElem
		});
	};

	var CharacterView = function(characters) {
		CharacterView.super.apply(this);
		var self = this;

		this.elem = template.create('character-template', { tagName: 'tr' });
		this.actorWrapperElem = this.elem.getElementsByClassName('actor-wrapper')[0];
		this.replyWrapperElem = this.elem.getElementsByClassName('reply-wrapper')[0];

		this.views = [];

		var validChangeListener = function() {
			if (self.isValid()) {
				self.trigger('validate');
			} else {
				self.trigger('invalidate');
			}
		};

		this.actorSelectView = new ActorSelectView(characters, 'duke');
		this.actorSelectView.attachTo(this.actorWrapperElem);
		this.views.push(this.actorSelectView);
		this.actorSelectView.on('invalidate', validChangeListener);
		this.actorSelectView.on('validate', validChangeListener);

		for (var i = 0; i < 5; i++) {
			var replyView = new ReplyView('тестовый текст');
			replyView.attachTo(this.replyWrapperElem);
			replyView.on('invalidate', validChangeListener);
			replyView.on('validate', validChangeListener);
			self.views.push(replyView);
		}

		this.once('dispose', function(event) {
			self.views.forEach(function(view) {
				view.dispose();
			});
			self.views = [];
		});
	};
	CharacterView.super = View;
	CharacterView.prototype = Object.create(View.prototype);
	CharacterView.prototype.constructor = CharacterView;
	CharacterView.prototype.isValid = function() {
		var valid = true;
		for (var i = 0; i < this.views.length; i++) {
			valid = this.views[i].isValid();
			if (!valid) {
				break;
			}
		}
		return valid;
	};
	CharacterView.prototype.reset = function() {
		this.views.forEach(function(view) {
			view.reset();
		});
	};
	CharacterView.prototype.validate = function() {
		this.views.forEach(function(view) {
			view.validate();
		});
	};

	var ActorSelectView = function(characters, selectedCharacter) {
		ActorSelectView.super.apply(this);
		var self = this;

		this.elem = document.createElement('select');
		this.elem.classList.add('actor');
		this.valid = true;
		this.lastValue = selectedCharacter;

		characters.forEach(function(character) {
			var option = document.createElement('option');
			option.value = character;
			option.textContent = character;
			self.elem.appendChild(option);
		});

		var elemChangeListener = function(event) {
			self.invalidate();
		};

		this.elem.value = this.lastValue;
		this.elem.addEventListener('change', elemChangeListener);

		this.on('validate', function() {
			this.elem.classList.remove('invalid');
		});
		this.on('invalidate', function() {
			this.elem.classList.add('invalid');
		});
		this.once('dispose', function(event) {
			this.elem.removeEventListener('change', elemChangeListener);
		});
	};
	ActorSelectView.super = View;
	ActorSelectView.prototype = Object.create(View.prototype);
	ActorSelectView.prototype.constructor = ActorSelectView;
	ActorSelectView.prototype.validate = function() {
		if (!this.valid) {
			this.valid = true;
			this.lastValue = this.elem.value;
			this.trigger({
				type: 'validate',
				value: this.lastValue
			})
		}
	};
	ActorSelectView.prototype.reset = function() {
		if (!this.valid) {
			this.valid = true;
			this.elem.value = this.lastValue;
			this.trigger({
				type: 'validate',
				value: this.lastValue
			});
		}
	};
	ActorSelectView.prototype.invalidate = function() {
		if (this.elem.value === this.lastValue) {
			this.valid = true;
			this.trigger({
				type: 'validate',
				value: this.elem.value
			});
		} else {
			this.valid = false;
			this.trigger({
				type: 'invalidate',
				value: this.elem.value
			});
		}
	};
	ActorSelectView.prototype.isValid = function() {
		return this.valid;
	};

	var ReplyView = function(text) {
		ReplyView.super.apply(this);
		var self = this;

		this.elem = document.createElement('input');
		this.elem.type = 'text';
		this.elem.classList.add('text');
		this.elem.value = text;

		this.valid = true;
		this.lastValue = text;

		var elemInputListener = function(event) {
			self.invalidate();
		};

		this.elem.addEventListener('input', elemInputListener);

		this.on('validate', function() {
			this.elem.classList.remove('invalid');
		});
		this.on('invalidate', function() {
			this.elem.classList.add('invalid');
		});
		this.once('dispose', function(event) {
			this.elem.removeEventListener('input', elemInputListener);
		});
	};
	ReplyView.super = View;
	ReplyView.prototype = Object.create(View.prototype);
	ReplyView.prototype.constructor = ReplyView;
	ReplyView.prototype.validate = function() {
		if (!this.valid) {
			this.valid = true;
			this.lastValue = this.elem.value;
			this.trigger({
				type: 'validate',
				value: this.lastValue
			});
		}
	};
	ReplyView.prototype.reset = function() {
		if (!this.valid) {
			this.valid = true;
			this.elem.value = this.lastValue;
			this.trigger({
				type: 'validate',
				value: this.lastValue
			});
		}
	};
	ReplyView.prototype.invalidate = function() {
		if (this.elem.value === this.lastValue) {
			this.valid = true;
			this.trigger({
				type: 'validate',
				value: this.elem.value
			});
		} else {
			this.valid = false;
			this.trigger({
				type: 'invalidate',
				value: this.elem.value
			});
		}
	};
	ReplyView.prototype.isValid = function() {
		return this.valid;
	};

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
		SkipDialogView: SkipDialogView,
		MessageView: MessageView,
		MessagePatternView: MessagePatternView,
		ContactView: ContactView
	};

})(messenger, abyss, template);