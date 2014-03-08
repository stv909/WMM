var messenger = messenger || {};

(function(messenger, abyss, template, async, uuid, html, errors) {

	var View = abyss.View;
	var ErrorCodes = errors.ErrorCodes;

	var SelectPageView = function() {
		SelectPageView.super.apply(this);
		var self = this;

		this.elem = template.create('select-page-template', { id: 'select-page' });
		this.patternsElem = this.elem.getElementsByClassName('patterns')[0];
		this.loadHolderElem = this.elem.getElementsByClassName('load-holder')[0];
		this.loadElem = this.elem.getElementsByClassName('load')[0];
		this.preloadElem = this.elem.getElementsByClassName('preload')[0];
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		
		this.selectedMessageView = null;
		this.messageViews = {};
		this.loadElemEnable = true;

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
		
		var loadElemClickListener = function(event) {
			if (self.loadElemEnable) {
				self.trigger({
					type: 'click:load'
				});
			}
		};
		var preloadElemClickListener = function(event) {
			self.trigger({
				type: 'click:preload'
			});
		};
		var wheelListener = function(event) {
			this.scrollTop -= event.wheelDelta;
			event.preventDefault();
		};
		
		this.loadElem.addEventListener('click', loadElemClickListener);
		this.preloadElem.addEventListener('click', preloadElemClickListener);
		this.containerElem.addEventListener('wheel', wheelListener);
		
		this.once('dispose', function(event) {
			self.loadElem.removeEvent('click', loadElemClickListener);
			self.preloadElem.removeEventListener('click', preloadElemClickListener);
			self.containerElem.removeEventListener('wheel', wheelListener);
		});

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
	SelectPageView.prototype.addMessagePatternView = function(messageView, first) {
		if (first) {
			messageView.attachFirstTo(this.patternsElem);
		} else {
			messageView.attachTo(this.patternsElem);
		}
		var message = messageView.model;
		var messageId = message.get('id');
		this.messageViews[messageId] = messageView;
		messageView.on('select', this.messagePatternSelectListener);
		if (!this.selectedMessageView) {
			messageView.select();
		}
	};
	SelectPageView.prototype.setMessage = function(messageId) {
		var messageView = this.messageViews[messageId];
		if (messageView) {
			messageView.select();
		}
	};
	SelectPageView.prototype.enableMessageLoading = function() {
		this.loadElemEnable = true;
		this.loadElem.textContent = 'Загрузить еще...';
	};
	SelectPageView.prototype.disableMessageLoading = function() {
		this.loadElemEnable = false;
		this.loadElem.textContent = 'Загрузка...';
	};
	SelectPageView.prototype.hideMessageLoading = function() {
		this.loadHolderElem.classList.add('hidden');
	};
	SelectPageView.prototype.showMessageLoading = function() {
		this.loadHolderElem.classList.remove('hidden');	
	};
	SelectPageView.prototype.setPreloadedMessageCount = function(count) {
		if (count === 0) {
			this.preloadElem.classList.add('hidden');
		} else {
			this.preloadElem.classList.remove('hidden');
			this.preloadElem.textContent = ['Загрузить новые шаблоны (+', count, ')'].join('');
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
			});
		});
		this.updateElem.addEventListener('click', function() {
			var data = self.getData();
			var metas = data.map(self.formatMeta);
			var requests = metas.map(function(meta) {
				return Promise.all([meta, self.requestAnimationAsync(meta)]);
			});
			Promise.all(requests).then(function(values) {
				values.forEach(function(value) {
					var meta = value[0];
					var response = value[1];
					var data = JSON.parse(response);
					var layer = meta.layer;
					delete meta.layer;
					layer.src = settings.layerImageStoreBaseUrl + data.output.images[0];
					meta.url = layer.src;
					layer.dataset.meta= JSON.stringify(meta);
				});
				self.characterViewCollection.forEach(function(view) {
					view.validate();
				});
				self.updateMessageDialogView.setMode('complete');
			}).catch(function() {
				self.updateMessageDialogView.setMode('fail');
			});
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
		this.trigger('status:validate');
	};
	EditPageView.prototype.getMessageContent = function() {
		return this.messageEditorView.cachedFullElem.innerHTML;
	};
	EditPageView.prototype.clear = function() {
		this.characterViewCollection.forEach(function(view) {
			view.dispose();
		});
		this.memosElem.innerHTML = '';
		this.resetElem.classList.add('hidden');
		this.updateElem.classList.add('hidden');
		this.characterCollectionElem.innerHTML = '';
		this.characterViewCollection = [];
	};
	EditPageView.prototype._parseLayerTypeText = function(rootElem) {
		var textElements = rootElem.getElementsByClassName('layerType_text');
		textElements = Array.prototype.slice.call(textElements, 0);
		textElements = textElements.sort(function(elem1, elem2) {
			if (elem1.style.zIndex > elem2.style.zIndex) {
				return -1;
			} else if (elem1.style.zIndex <= elem2.style.zIndex) {
				return 1;
			} else {
				return 0;
			}
		});
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
			layer: layerActorElem,
			layerId: layerId,
			actors: meta.actors,
			phrases: phrases,
			hints: hints,
			type: meta.type
		};

		var characterView = new CharacterView(this.characters, characterData);
		characterView.attachTo(this.characterCollectionElem);
		characterView.on('validate', function() {
			if (self.isValid()) {
				self.updateElem.classList.add('hidden');
				self.resetElem.classList.add('hidden');
				self.trigger('status:validate');
			} else {
				self.updateElem.classList.remove('hidden');
				self.resetElem.classList.remove('hidden');
				self.trigger('status:invalidate');
			}
		});
		characterView.on('invalidate', function() {
			if (self.isValid()) {
				self.updateElem.classList.add('hidden');
				self.resetElem.classList.add('hidden');
				self.trigger('status:validate');
			} else {
				self.updateElem.classList.remove('hidden');
				self.resetElem.classList.remove('hidden');
				self.trigger('status:invalidate');
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
		});
	};
	EditPageView.prototype.setCharacters = function(characters) {
		this.characters = characters;
	};
	EditPageView.prototype.getData = function() {
		var data = [];
		this.characterViewCollection.forEach(function(view) {
			if (!view.isValid()) {
				data.push(view.getData());
			}
		});
		return data;
	};
	EditPageView.prototype.formatMeta = function(dataItem) {
		var commandChunks = [];
		var replies = dataItem.replies;
		replies.forEach(function(reply) {
			commandChunks.push(reply.hint);
			commandChunks.push(reply.phrase);
		});
		commandChunks.push(dataItem.const);

		var meta = {
			layer: dataItem.layer,
			actors: dataItem.actors,
			commands: commandChunks.join(''),
			type: dataItem.type,
			url: dataItem.layer.src
		};

		return meta;
	};
	EditPageView.prototype.requestAnimationAsync = function(meta) {
		var commandChunks = [];

		commandChunks.push('<?xml version="1.0"?><commands version="1.0.0"><');
		commandChunks.push(meta.type);
		commandChunks.push('>');
		commandChunks.push(meta.commands);
		commandChunks.push('</');
		commandChunks.push(meta.type);
		commandChunks.push('></commands>');

		meta.layer.src = '';

		var requestData = {
			input: {
				id: uuid.v4(),
				destination: 'separate',
				commands: commandChunks.join(''),
				actors: meta.actors
			}
		};

		var url = settings.animationServiceUrl;
		var data = 'type=build&data=' + encodeURIComponent(JSON.stringify(requestData));

		return async.requestAsync({
			url: url,
			data: data,
			method: 'POST',
			headers: [{
				key: 'Content-Type',
				value: 'text/html'
			}]
		});
	};

	var PostPageView = function() {
		PostPageView.super.apply(this);
		var self = this;

		this.elem = template.create('post-page-template', { id: 'post-page' });
		this.contactsElem = this.elem.getElementsByClassName('contacts')[0];
		this.receiverHolderElem = this.elem.getElementsByClassName('receiver-holder')[0];
		this.loadElem = this.elem.getElementsByClassName('load')[0];
		this.loadHolderElem = this.elem.getElementsByClassName('load-holder')[0];
		this.queryElem = this.elem.getElementsByClassName('query')[0];
		this.searchResultsElem = this.elem.getElementsByClassName('search-results')[0];
		this.searchResultsWrapElem = this.searchResultsElem.getElementsByClassName('wrap')[0];

		this.cachedContactViews = {};
		this.contactViews = {};
		this.selectedContactView = null;
		this.receiverContactView = new ContactView();
		this.receiverContactView.attachTo(this.receiverHolderElem);
		this.receiverContactView.select();
		
		this.loadElemEnable = true;
		
		this.contactViewSelectListener = function(event) {
			var target = event.target;
			if (target !== self.selectedContactView) {
				if (self.selectedContactView) {
					self.selectedContactView.deselect();
				}
				self.selectedContactView = target;
				self._setReceiver(self.selectedContactView.model);
				self.trigger({
					type: 'select:contact',
					contact: self.selectedContactView.model
				});
			}
		};
		
		var loadElemClickListener = function(event) {
			if (self.loadElemEnable) {
				self.trigger('click:load');
			}
		};
		var lastQueryText = this.queryElem.value;
		var lastQueryTimeout = null;
		var queryElemInputListener = function(event) {
			var queryText = self.queryElem.value;
			if (lastQueryTimeout) {
				clearTimeout(lastQueryTimeout);
				lastQueryTimeout = null;
			}
			if (lastQueryText !== queryText) {
				lastQueryTimeout = setTimeout(function() {
					lastQueryText = queryText;
					self.trigger({
						type: 'update:search',
						text: queryText
					});
				}, 800);
			}
		};
		var wheelListener = function(event) {
			this.scrollTop -= event.wheelDelta;
			event.preventDefault();
		};
		
		this.loadElem.addEventListener('click', loadElemClickListener);
		this.queryElem.addEventListener('input', queryElemInputListener);
		this.searchResultsWrapElem.addEventListener('wheel', wheelListener);
		
		this.once('dispose', function(event) {
			self.loadElem.removeEventListener('click', loadElemClickListener);
			self.queryElem.removeEventListener('input', queryElemInputListener);
			self.searchResultsWrapElem.removeEventListener('wheel', wheelListener);
		});

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
	PostPageView.prototype.showContact = function(contact) {
		var contactId = contact.get('id');
		var contactView = this._getOrCreateContactView(contact);
		contactView.attachTo(this.contactsElem);
		contactView.on('select', this.contactViewSelectListener);
		this.contactViews[contactId] = contactView;
		if (!this.selectedContactView) {
			contactView.select();
		}
	};
	PostPageView.prototype.selectContact = function(contact) {
		var contactView = this._getOrCreateContactView(contact);
		contactView.select();
	};
	PostPageView.prototype._setReceiver = function(contact) {
		this.receiverContactView.setModel(contact);
	};
	PostPageView.prototype.clear = function() {
		var self = this;
		Object.keys(this.contactViews).forEach(function(key) {
			self.contactViews[key].detach();	
		});
		this.contactViews = {};
	};
	PostPageView.prototype.enableContactLoading = function() {
		this.loadElemEnable = true;
		this.loadElem.textContent = 'Загрузить еще...';
	};
	PostPageView.prototype.disableContactLoading = function() {
		this.loadElemEnable = false;
		this.loadElem.textContent = 'Загрузка...';
	};
	PostPageView.prototype.hideContactLoading = function() {
		this.loadHolderElem.classList.add('hidden');
	};
	PostPageView.prototype.showContactLoading = function() {
		this.loadHolderElem.classList.remove('hidden');	
	};
	PostPageView.prototype._getOrCreateContactView = function(contact) {
		var contactId = contact.get('id');
		var contactView = this.cachedContactViews[contactId];
		if (!contactView) {
			contactView = new ContactView(contact);
			this.cachedContactViews[contactId] = contactView;
		}
		return contactView;
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
		if (contact) {
			this.contactView.setModel(contact);
		}
	};
	AnswerPageView.prototype.setMessage = function(message) {
		this.messageEditorView.setModel(message);
	};

	var PreloadDialogView = function() {
		PreloadDialogView.super.apply(this);

		this.elem = document.getElementById('preload-background');
	};
	PreloadDialogView.super = View;
	PreloadDialogView.prototype = Object.create(View.prototype);
	PreloadDialogView.prototype.constructor = PreloadDialogView;
	PreloadDialogView.prototype.show = function() {
		this.elem.classList.remove('hidden');
	};
	PreloadDialogView.prototype.hide = function() {
		var self = this;
		setTimeout(function() {
			self.elem.classList.add('hidden');
		}, 0);
	};
	
	var AskMessageDialogView = function() {
		AskMessageDialogView.super.apply(this);
		var self = this;
		
		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('ask-message-dialog');
		this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];
		this.cancelElem = this.dialogWindowElem.getElementsByClassName('cancel')[0];
		
		var okElemClickListener = function(event) {
			self.hide();
			self.trigger('click:ok');
		};
		var cancelElemClickListener = function() {
			self.hide();
			self.trigger('click:cancel');
		};
		
		this.okElem.addEventListener('click', okElemClickListener);
		this.cancelElem.addEventListener('click', cancelElemClickListener);
		
		this.once('dispose', function(event) {
			self.okElem.removeEventListener('click', okElemClickListener);
			self.cancelElem.removeEventListener('click', cancelElemClickListener);
		});
	};
	AskMessageDialogView.super = View;
	AskMessageDialogView.prototype = Object.create(View.prototype);
	AskMessageDialogView.prototype.constructor = AskMessageDialogView;
	AskMessageDialogView.prototype.hide = function() {
		this.dialogWindowElem.classList.add('hidden');
		this.elem.classList.add('hidden');	
	};
	AskMessageDialogView.prototype.show = function() {
		this.dialogWindowElem.classList.remove('hidden');
		this.elem.classList.remove('hidden');
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
			self.okElem.removeEventListener('click', okElemClickListener);
			self.cancelElem.removeEventListener('click', cancelElemClickListener);
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
		this.statusElem = this.dialogWindowElem.getElementsByClassName('status')[0];
		
		this.complete = false;

		var readyElemClickListener = function(event) {
			self.hide();
			if (self.complete) {
				self.trigger('click:close');
			}
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
		this.setMode('wait');
	};
	PostDialogView.prototype.hide = function() {
		this.dialogWindowElem.classList.add('hidden');
		this.elem.classList.add('hidden');
		this.statusElem.textContent = '';
	};
	PostDialogView.prototype.setText = function(text) {
		this.statusElem.textContent = text;
	};
	PostDialogView.prototype.setMode = function(mode) {
		switch (mode) {
			case 'wait':
				this.statusElem.textContent = 'Отправка сообщения...';
				this.readyElem.classList.add('hidden');
				this.complete = false;
				break;
			case 'complete':
				this.statusElem.textContent = 'Сообщение отправлено!';
				this.readyElem.classList.remove('hidden');
				this.complete = true;
				break;
			case 'fail':
				this.statusElem.textContent = 'Сообщение не отправлено!';
				this.readyElem.classList.remove('hidden');
				this.complete = false;
		}
	};

	var UpdateMessageDialogView = function() {
		UpdateMessageDialogView.super.apply(this);
		var self = this;

		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('update-message-dialog');
		this.statusElem = this.dialogWindowElem.getElementsByClassName('status')[0];
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
		this.setMode('wait');
	};
	UpdateMessageDialogView.prototype.hide = function() {
		this.dialogWindowElem.classList.add('hidden');
		this.elem.classList.add('hidden');
	};
	UpdateMessageDialogView.prototype.setMode = function(mode) {
		switch (mode) {
			case 'wait':
				this.dialogWindowElem.classList.remove('error');
				this.statusElem.textContent = 'Идет обновление персонажей...';
				this.readyElem.classList.add('hidden');
				break;
			case 'complete':
				this.dialogWindowElem.classList.remove('error');
				this.statusElem.textContent = 'Персонажи обновлены!';
				this.readyElem.classList.remove('hidden');
				break;
			case 'fail':
				this.dialogWindowElem.classList.add('error');
				this.statusElem.textContent = 'Ошибка обновления!\n Проверьте интернет-подключение и \nпопробуйте позже.';
				this.readyElem.classList.remove('hidden');
				break;
		}
	};
	
	var ErrorDialogView = function() {
		ErrorDialogView.super.apply(this);
		var self = this;
		
		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('error-dialog');
		this.statusElem = this.dialogWindowElem.getElementsByClassName('status')[0];
		this.okElem = this.dialogWindowElem.getElementsByClassName('ok')[0];

		var okElemClickListener = function(event) {
			self.hide();
			self.trigger('click:close');
		};

		this.okElem.addEventListener('click', okElemClickListener);

		this.once('dispose', function() {
			self.readyElem.removeEventListener('click', okElemClickListener);
		});
	};
	ErrorDialogView.super = View;
	ErrorDialogView.prototype = Object.create(View.prototype);
	ErrorDialogView.prototype.constructor = ErrorDialogView;
	ErrorDialogView.prototype.show = function(error) {
		console.log(error);
		var message = 'Неизвестная ошибка';
		switch (error.errorCode) {
			case ErrorCodes.NO_CONNECTION:
				message = 'Отсутствует интернет-соединение.\nПопробуйте позже.';
				break;
			case ErrorCodes.API_ERROR:
				message = 'Ошибка вызова интернет-сервиса.';
				break;
			case ErrorCodes.TIMEOUT:
				message = 'Не удалось выполнить операцию.\n Проверьте интернет-подключение и \nпопробуйте позже.';
				break;
		}
		this.statusElem.textContent = message;
		this.dialogWindowElem.classList.remove('hidden');
		this.elem.classList.remove('hidden');	
	};
	ErrorDialogView.prototype.hide = function() {
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

	var CharacterView = function(characters, characterData) {
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
		console.log(this.elem);
		console.log(this.actorWrapperElem);
		this.actorSelectView = new ActorSelectView(characters, characterData);
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

	var ActorSelectView = function(characters, characterData) {
		ActorSelectView.super.apply(this);
		var self = this;

		var actor = characterData.actors[0];

		this.elem = document.createElement('select');
		this.elem.classList.add('actor');
		this.elem.setAttribute('data-name', actor.name);
		this.valid = true;
		this.lastValue = actor.character;

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
			self.elem.classList.remove('invalid');
		});
		this.on('invalidate', function() {
			self.elem.classList.add('invalid');
		});
		this.once('dispose', function(event) {
			self.elem.removeEventListener('change', elemChangeListener);
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
			});
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
	ActorSelectView.prototype.getData = function() {
		return {
			name: this.elem.dataset.name,
			character: this.elem.value
		};
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

	var ContactView = function(model) {
		ContactView.super.apply(this);
		var self = this;

		this.elem = template.create('contact-template', { className: 'contact' });
		this.photoElem = this.elem.getElementsByClassName('photo')[0];
		this.fullNameElem = this.elem.getElementsByClassName('full-name')[0]

		this.selected = false;
		this.setModel(model);
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.select();
			}
		};
		var fullNameElemClickListener = function(event) {
			//if (self.selected) {
			var vkLink = ['https://vk.com/id', self.model.get('id')].join('');
			window.open(vkLink, '_blank');
			//}
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
		//this.fullNameElem.classList.add('selected');
		this.trigger('select');
	};
	ContactView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.add('normal');
		this.elem.classList.remove('chosen');
		//this.fullNameElem.classList.remove('selected');
	};
	ContactView.prototype.setModel = function(model) {
		if (model) {
			this.model = model;
			this.photoElem.src = this.model.get('photo');
			var fullName = [this.model.get('firstName'), this.model.get('lastName')].join(' ');
			this.fullNameElem.textContent = fullName;
		}
	};

	messenger.views = {
		SelectPageView: SelectPageView,
		EditPageView: EditPageView,
		PostPageView: PostPageView,
		AnswerPageView: AnswerPageView,
		PostDialogView: PostDialogView,
		SkipDialogView: SkipDialogView,
		PreloadDialogView: PreloadDialogView,
		AskMessageDialogView: AskMessageDialogView,
		ErrorDialogView: ErrorDialogView,
		MessageView: MessageView,
		MessagePatternView: MessagePatternView,
		ContactView: ContactView
	};

})(messenger, abyss, template, async, uuid, html, errors);