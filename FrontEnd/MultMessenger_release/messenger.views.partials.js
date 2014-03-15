var messenger = messenger || {};

(function(messenger, abyss, template, analytics) {
	
	var View = abyss.View;
	
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
				analytics.send('tape', 'msg_select_new');
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
	
	var ContactView = function(model) {
		ContactView.super.apply(this);
		var self = this;

		this.elem = template.create('contact-template', { className: 'contact' });
		this.photoElem = this.elem.getElementsByClassName('photo')[0];
		this.fullNameElem = this.elem.getElementsByClassName('full-name')[0];

		this.selected = false;
		this.setModel(model);
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.select();
				analytics.send('friends', 'friends_select');
			}
		};
		var fullNameElemClickListener = function(event) {
			var vkLink = ['https://vk.com/id', self.model.get('id')].join('');
			window.open(vkLink, '_blank');
		};

		this.elem.addEventListener('click', elemClickListener);
		this.fullNameElem.addEventListener('click', fullNameElemClickListener);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
			self.fullNameElem.removeEventListener('click', fullNameElemClickListener);
		});
	};
	ContactView.super = View;
	ContactView.prototype = Object.create(View.prototype);
	ContactView.prototype.constructor = ContactView;
	ContactView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.remove('normal');
		this.elem.classList.add('chosen');
		this.trigger('select');
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
			var fullName = [this.model.get('firstName'), this.model.get('lastName')].join(' ');
			this.fullNameElem.textContent = fullName;
			if (!this.model.get('canPost')) {
				this.elem.classList.add('closed');
			} else {
				this.elem.classList.remove('closed');
			}
		}
	};
	
	var CharacterView = function(characterData, characters, charactersDialogView) {
		CharacterView.super.apply(this);
		var self = this;

		this.elem = template.create('character-template', { tagName: 'tr' });
		this.elem.id = characterData.layerId;
		this.elem.dataset.const = characterData.hints[characterData.hints.length - 1];
		this.elem.dataset.type = characterData.type;
		this.actorWrapperElem = this.elem.getElementsByClassName('actor-wrapper')[0];
		this.replyWrapperElem = this.elem.getElementsByClassName('reply-wrapper')[0];
		this.layer = characterData.layer;

		this.views = [];

		var validChangeListener = function() {
			if (self.isValid()) {
				self.trigger('validate');
			} else {
				self.trigger('invalidate');
			}
		};

		this.actorSelectView = new ActorSelectView(characterData, characters, charactersDialogView);
		this.actorSelectView.attachTo(this.actorWrapperElem);
		this.views.push(this.actorSelectView);
		this.actorSelectView.on('invalidate', validChangeListener);
		this.actorSelectView.on('validate', validChangeListener);

		var phrases = characterData.phrases;
		var hints = characterData.hints;
		if (phrases.length !== 0) {
			for (var i = 0; i < phrases.length; i++) {
				var replyView = new ReplyView(phrases[i], hints[i]);
				replyView.attachTo(this.replyWrapperElem);
				replyView.on('invalidate', validChangeListener);
				replyView.on('validate', validChangeListener);
				this.views.push(replyView);
			}
		} else {
			var emptyReplyView = new EmptyReplyView();
			emptyReplyView.attachTo(this.replyWrapperElem);
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
	CharacterView.prototype.getData = function() {
		var data = {
			layer: this.layer,
			layerId: this.elem.id,
			const: this.elem.dataset.const,
			type: this.elem.dataset.type,
			actors: [this.actorSelectView.getData()],
			replies: []
		};
		for (var i = 1; i < this.views.length; i++) {
			data.replies.push(this.views[i].getData());
		}
		return data;
	};
	
	var ActorSelectView = function(characterData, characters, charactersDialogView) {
		ActorSelectView.super.apply(this);
		var self = this;

		var actor = characterData.actors[0];
		
		this.elem = template.create('actor-template', { className: 'actor' });
		this.elem.setAttribute('data-name', actor.name);
		this.actorImageElem = this.elem.getElementsByClassName('actor-image')[0];
		this.actorNameElem = this.elem.getElementsByClassName('actor-name')[0];
		this.valid = true;
		this.lastValue = actor.character;
		this.value = actor.character;;
		this.characters = characters;
		this.charactersDialogView = charactersDialogView;

		this._setActor(this.lastValue);

		var elemClickListener = function(event) {
			self.charactersDialogView.show(self.value || self.lastValue);
			self.charactersDialogView.once('select:character', function(event) {
				var character = event.character;
				self.value = character.key;
				self._setActor(character.key);
				self.invalidate();
				analytics.send('editor', 'edit_character');
			});
		};

		this.elem.addEventListener('click', elemClickListener);

		this.on('validate', function() {
			self.elem.classList.remove('invalid');
		});
		this.on('invalidate', function() {
			self.elem.classList.add('invalid');
		});
		this.once('dispose', function(event) {
			self.elem.removeEventListener('change', elemClickListener);
		});
	};
	ActorSelectView.super = View;
	ActorSelectView.prototype = Object.create(View.prototype);
	ActorSelectView.prototype.constructor = ActorSelectView;
	ActorSelectView.prototype.validate = function() {
		if (!this.valid) {
			this.valid = true;
			this.lastValue = this.value;
			this.trigger({
				type: 'validate',
				value: this.lastValue
			});
		}
	};
	ActorSelectView.prototype.reset = function() {
		if (!this.valid) {
			this.valid = true;
			this.value = this.lastValue;
			this._setActor(this.value);
			this.trigger({
				type: 'validate',
				value: this.lastValue
			});
		}
	};
	ActorSelectView.prototype.invalidate = function() {
		if (this.value === this.lastValue) {
			this.valid = true;
			this.trigger({
				type: 'validate',
				value: this.value
			});
		} else {
			this.valid = false;
			this.trigger({
				type: 'invalidate',
				value: this.value
			});
		}
	};
	ActorSelectView.prototype.isValid = function() {
		return this.valid;
	};
	ActorSelectView.prototype.getData = function() {
		return {
			name: this.elem.dataset.name,
			character: this.value
		};
	};
	ActorSelectView.prototype._setActor = function(actorName) {
		var character = null;
		for (var i = 0; i < this.characters.length; i++) {
			if (this.characters[i].key === actorName) {
				character = this.characters[i];
				break;
			}
		}
		if (character) {
			this.actorImageElem.src = character.image;
			this.actorNameElem.textContent = character.key;
		}
	};
	
	var ReplyView = function(phrase, hint) {
		ReplyView.super.apply(this);
		var self = this;

		this.elem = document.createElement('input');
		this.elem.type = 'text';
		this.elem.classList.add('text');
		this.elem.dataset.const = hint;
		this.elem.value = phrase;

		this.valid = true;
		this.lastValue = phrase;

		var elemInputListener = function(event) {
			self.invalidate();
			analytics.send('editor', 'edit_phrase');
		};

		this.elem.addEventListener('input', elemInputListener);

		this.on('validate', function() {
			self.elem.classList.remove('invalid');
		});
		this.on('invalidate', function() {
			self.elem.classList.add('invalid');
		});
		this.once('dispose', function(event) {
			self.elem.removeEventListener('input', elemInputListener);
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
	ReplyView.prototype.getData = function() {
		return {
			hint: this.elem.dataset.const,
			phrase: this.elem.value
		};
	};
	
	var EmptyReplyView = function() {
		EmptyReplyView.super.apply(this);
		
		this.elem = document.createElement('div');
		this.elem.classList.add('no-reply');
		this.elem.textContent = 'У персонажа нет реплик';
	};
	EmptyReplyView.super = View;
	EmptyReplyView.prototype = Object.create(View.prototype);
	EmptyReplyView.prototype.constructor = EmptyReplyView;
	
	var CharacterItemView = function(characterItem) {
		CharacterItemView.super.apply(this);
		var self = this;
		
		this.elem = template.create('character-item-template', { className: 'character-item' });
		this.characterImageElem = this.elem.getElementsByClassName('character-image')[0];
		
		this.characterItem = characterItem;
		this.selected = false;

		this.characterImageElem.src = characterItem.image;
		
		this.deselect();
		
		var elemClickListener = function(event) {
			if (!self.selected) {
				self.select();
			}		
		};
		
		this.elem.addEventListener('click', elemClickListener);
		this.once('dispose', function(event) {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	CharacterItemView.super = View;
	CharacterItemView.prototype = Object.create(View.prototype);
	CharacterItemView.prototype.constructor = CharacterItemView;
	CharacterItemView.prototype.select = function(silent) {
		this.elem.classList.remove('normal');
		this.elem.classList.add('chosen');
		if (!silent) {
			this.trigger({
				type: 'select:character',
				character: this.characterItem
			});
		}
		this.selected = true;
	};
	CharacterItemView.prototype.deselect = function() {
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.selected = false;
	};
	
	messenger.views = messenger.views || {};
	
	messenger.views.MessageView = MessageView;
	messenger.views.MessagePatternView = MessagePatternView;
	messenger.views.MessageEditorView = MessageEditorView;
	messenger.views.ContactView = ContactView;
	messenger.views.CharacterView = CharacterView;
	messenger.views.CharacterItemView = CharacterItemView;

}(messenger, abyss, template, analytics));