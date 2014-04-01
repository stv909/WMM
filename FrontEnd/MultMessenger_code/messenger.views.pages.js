var messenger = messenger || {};

(function(messenger, abyss, template, settings, uuid, async, Q, html, analytics, filmlang) {
	
	var View = abyss.View;
	
	var MessageEditorView = messenger.views.MessageEditorView;
	var UserView = messenger.views.UserView;
	var CharacterView = messenger.views.CharacterView;
	var ImageItemView = messenger.views.ImageItemView;

	var UpdateMessageDialogView = messenger.views.UpdateMessageDialogView;
	var CharactersDialogView = messenger.views.CharactersDialogView;
	var ImageSelectDialogView = messenger.views.ImageSelectDialogView;
	
	var FilmText = filmlang.FilmText;

	var AnswerPageView = function() {
		AnswerPageView.super.apply(this);
		var self = this;

		this.elem = template.create('answer-page-template', { id: 'answer-page' });
		this.messageWrapperElem = this.elem.getElementsByClassName('message-wrapper')[0];
		this.contactWrapElem = this.elem.getElementsByClassName('contact-wrapper')[0];
		this.contactHolderElem = this.contactWrapElem.getElementsByClassName('contact-holder')[0];
		this.answerElem = this.contactWrapElem.getElementsByClassName('answer')[0];

		this.messageEditorView = new MessageEditorView();
		this.messageEditorView.attachTo(this.messageWrapperElem);

		this.userView = new UserView();
		this.userView.attachTo(this.contactHolderElem);
		this.userView.select();

		this.hide();
		
		var answerElemClickListener = function(event) {
			self.trigger('click:answer');
		};
		
		this.answerElem.addEventListener('click', answerElemClickListener);
		this.once('dispose', function() {
			self.answerElem.remove('click', answerElemClickListener);	
		});
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
		this.userView.setModel(contact);
	};
	AnswerPageView.prototype.setMessage = function(message) {
		this.messageEditorView.setModel(message);
	};
	
	var SelectPageView = function() {
		SelectPageView.super.apply(this);
		var self = this;

		this.elem = template.create('select-page-template', { id: 'select-page' });
		this.patternsElem = this.elem.getElementsByClassName('patterns')[0];
		this.loadHolderElem = this.elem.getElementsByClassName('load-holder')[1];
		this.loadElem = this.elem.getElementsByClassName('load')[0];
		this.preloadElem = this.elem.getElementsByClassName('preload')[0];
		this.containerElem = this.elem.getElementsByClassName('container')[0];
		this.teaserElem = this.elem.getElementsByClassName('teaser')[0];
		this.teaserCrossElem = this.teaserElem.getElementsByClassName('cross')[0];
		
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
				self.containerElem.classList.remove('shifted');
				self.teaserElem.classList.add('hidden');
			}
		};
		var preloadElemClickListener = function(event) {
			self.trigger({
				type: 'click:preload'
			});
		};
		var wheelListener = function(event) {
            var delta = (event.wheelDelta) ? -event.wheelDelta : event.detail;
            var isIE = Math.abs(delta) >= 120;
            var scrollPending = isIE ? delta / 2 : 0;
            if (delta < 0 && (self.containerElem.scrollTop + scrollPending) <= 0) {
				self.containerElem.scrollTop = 0;
				event.preventDefault();
            }
            else if (delta > 0 && (self.containerElem.scrollTop + scrollPending >= (self.containerElem.scrollHeight - self.containerElem.offsetHeight))) {
				self.containerElem.scrollTop = self.containerElem.scrollHeight - self.containerElem.offsetHeight;
				event.preventDefault();
            }
		};
		var crossClickListener = function(event) {
			event.preventDefault();
			event.stopPropagation();
			self.containerElem.classList.remove('shifted');
			self.teaserElem.classList.add('hidden');	
		};
		var crossMouseMoveListener = function(event) {
			event.stopPropagation();
			event.preventDefault();
		};
		var teaserElemClickListener = function(event) {
			html.scrollToBottom(self.containerElem);
			self.containerElem.classList.remove('shifted');
			self.teaserElem.classList.add('hidden');
			analytics.send('tape', 'hint_load_click');
		};
		
		this.loadElem.addEventListener('click', loadElemClickListener);
		this.preloadElem.addEventListener('click', preloadElemClickListener);
		this.containerElem.addEventListener('DOMMouseScroll', wheelListener, false);
		this.containerElem.addEventListener('mousewheel', wheelListener, false);
		this.teaserCrossElem.addEventListener('click', crossClickListener);
		this.teaserCrossElem.addEventListener('mousemove', crossMouseMoveListener);
		this.teaserElem.addEventListener('click', teaserElemClickListener);
		
		this.once('dispose', function(event) {
			self.loadElem.removeEvent('click', loadElemClickListener);
			self.preloadElem.removeEventListener('click', preloadElemClickListener);
			self.containerElem.removeEventListener('DOMMouseScroll', wheelListener);
			self.containerElem.removeEventListener('mousewheel', wheelListener);
			self.teaserCrossElem.removeEventListener('click', crossClickListener);
			self.teaserCrossElem.addEventListener('mousemove', crossMouseMoveListener);
			self.teaserElem.addEventListener('click', teaserElemClickListener);
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
			this.preloadElem.textContent = ['Загрузить новые мульты (+', count, ')'].join('');
		}
	};
	
	// var EditPageView = function() {
	// 	EditPageView.super.apply(this);
	// 	var self = this;

	// 	this.elem = template.create('edit-page-template', { id: 'edit-page' });
	// 	this.resetElem = this.elem.getElementsByClassName('reset')[0];
	// 	this.updateElem = this.elem.getElementsByClassName('update')[0];
	// 	this.messageWrapperElem = this.elem.getElementsByClassName('message-wrapper')[0];
	// 	this.wrapElem = this.messageWrapperElem.getElementsByClassName('wrap')[0];
		
	// 	this.memosElem = this.elem.getElementsByClassName('memos')[0];
	// 	this.memosSectionElem = this.memosElem.getElementsByClassName('section')[0];
	// 	this.memosCollectionElem = this.memosElem.getElementsByClassName('collection')[0];
		
	// 	this.imagesElem = this.elem.getElementsByClassName('images')[0];
	// 	this.imagesSectionElem = this.imagesElem.getElementsByClassName('section')[0];
	// 	this.imagesCollectionElem = this.imagesElem.getElementsByClassName('collection')[0];

	// 	this.characterCollectionElem = this.elem.getElementsByClassName('character-collection')[0];
		
	// 	this.messageEditorView = new MessageEditorView();
	// 	this.messageEditorView.attachFirstTo(this.messageWrapperElem);

	// 	this.updateMessageDialogView = new UpdateMessageDialogView();
	// 	this.updateMessageDialogView.on('click:close', function() {

	// 	});
		
	// 	this.charactersDialogView = new CharactersDialogView();
	// 	this.imageSelectDialogView = new ImageSelectDialogView();

	// 	this.characters = null;
	// 	this.characterViewCollection = [];
	// 	this.imageItemViewCollection = [];

	// 	this.messageEditorView.on('change:content', function(event) {
	// 		var elem = event.elem;
	// 		self.clear();
	// 		self._parseLayerTypeText(elem);
	// 		self._parseLayerTypeCustomImage(elem);
	// 		self._parseLayerTypeActor(elem);
	// 	});
	// 	this.resetElem.addEventListener('click', function() {
	// 		self.characterViewCollection.forEach(function(view) {
	// 			view.reset();
	// 		});
	// 		analytics.send('editor', 'update_cancel');
	// 	});
	// 	this.updateElem.addEventListener('click', function() {
	// 		var data = self.getData();
	// 		var metas = data.map(self.formatMeta);
	// 		var requests = metas.map(function(meta) {
	// 			return Q.all([meta, self.requestAnimationAsync(meta)]);
	// 		});
	// 		Q.all(requests).then(function(values) {
	// 			values.forEach(function(value) {
	// 				var meta = value[0];
	// 				var response = value[1];
	// 				var data = JSON.parse(response);
	// 				var layer = meta.layer;
	// 				delete meta.layer;
	// 				layer.src = settings.layerImageStoreBaseUrl + data.output.images[0];
	// 				meta.url = layer.src;
	// 				layer.dataset.meta= JSON.stringify(meta);
	// 			});
	// 			self.characterViewCollection.forEach(function(view) {
	// 				view.validate();
	// 			});
	// 			self.updateMessageDialogView.setMode('complete');
	// 			analytics.send('editor', 'edit_update', 'success');
	// 		}).catch(function(error) {
	// 			console.log(error);
	// 			self.updateMessageDialogView.setMode('fail');
	// 			analytics.send('editor', 'edit_update', 'fail');
	// 		});
	// 		self.updateMessageDialogView.show();
	// 	});
		
	// 	this.hide();
	// };

	// EditPageView.prototype.setMessage = function(message) {
	// 	this.messageEditorView.setModel(message);
	// 	this.trigger('status:validate');
	// };
	// EditPageView.prototype.getMessageContent = function() {
	// 	return this.messageEditorView.cachedFullElem.innerHTML;
	// };
	// EditPageView.prototype.clear = function() {
	// 	this.wrapElem.classList.add('hidden');
		
	// 	this.memosCollectionElem.innerHTML = '';
		
	// 	this.imageItemViewCollection.forEach(function(view) {
	// 		view.dispose();
	// 	});
	// 	this.imagesCollectionElem.innerHTML = '';
	// 	this.imagesElem.classList.add('hidden');
	// 	this.imageItemViewCollection = [];
		
	// 	this.characterViewCollection.forEach(function(view) {
	// 		view.dispose();
	// 	});
	// 	this.characterCollectionElem.innerHTML = '';
	// 	this.characterViewCollection = [];
	// };
	// EditPageView.prototype._parseLayerTypeText = function(rootElem) {
	// 	var textElements = rootElem.getElementsByClassName('layerType_text');
	// 	textElements = Array.prototype.slice.call(textElements, 0);
	// 	textElements = textElements.sort(function(elem1, elem2) {
	// 		var zIndex1 = parseInt(elem1.style.zIndex, 10);
	// 		var zIndex2 = parseInt(elem2.style.zIndex, 10);
	// 		if (zIndex1 > zIndex2) {
	// 			return -1;
	// 		} else if (zIndex1 <= zIndex2) {
	// 			return 1;
	// 		} else {
	// 			return 0;
	// 		}
	// 	});
	// 	for (var i = 0; i < textElements.length; i++) {
	// 		this._createTextElem(textElements[i]);
	// 	}
	// };
	// EditPageView.prototype._createTextElem = function(layerTextElem) {
	// 	var elem = document.createElement('input');

	// 	elem.className = 'text';
	// 	elem.type = 'text';
	// 	elem.value = layerTextElem.textContent;

	// 	elem.addEventListener('input', function() {
	// 		layerTextElem.textContent = elem.value;
	// 		analytics.send('editor', 'edit_caption');
	// 	});

	// 	this.memosCollectionElem.appendChild(elem);
	// };
	// EditPageView.prototype._parseLayerTypeActor = function(rootElem) {
	// 	var actorElements = rootElem.getElementsByClassName('layerType_actor');
	// 	for (var i = 0; i < actorElements.length; i++) {
	// 		this._createCharacterView(actorElements[i]);
	// 	}
	// };
	// EditPageView.prototype._createCharacterView = function(layerActorElem) {
	// 	var rawMeta = layerActorElem.dataset.meta;
	// 	var filmText = new FilmText(rawMeta);
	// 	console.log(rawMeta);
	// 	console.log(JSON.stringify(filmText.toMeta()));
	// 	// var rawMeta = layerActorElem.dataset.meta;
	// 	// var meta = JSON.parse(rawMeta);
	// 	// var self = this;

	// 	// var layerId = layerActorElem.className.split(' ')[0];
	// 	// var phrases = [];
	// 	// var hints = [];
	// 	// var commands = meta.commands;

	// 	// var startPos = commands.indexOf('</', startPos);
	// 	// var endPos = 0;
	// 	// while(startPos >= 0)
	// 	// {
	// 	// 	startPos = commands.indexOf('>', startPos) + 1;
	// 	// 	if (startPos > 0)
	// 	// 	{
	// 	// 		var end = commands.indexOf('<', startPos);
	// 	// 		if (end === -1)
	// 	// 			end = commands.length;
	// 	// 		if (startPos > 0 && end > startPos)
	// 	// 		{
	// 	// 			hints.push(commands.substring(endPos, startPos));
	// 	// 			phrases.push(commands.substring(startPos, end));
	// 	// 			endPos = end;
	// 	// 		}
	// 	// 	}
	// 	// 	startPos = commands.indexOf('</', startPos);
	// 	// }
	// 	// hints.push(commands.substring(endPos, commands.length));

	// 	// var characterData = {
	// 	// 	layer: layerActorElem,
	// 	// 	layerId: layerId,
	// 	// 	actors: meta.actors,
	// 	// 	phrases: phrases,
	// 	// 	hints: hints,
	// 	// 	type: meta.type
	// 	// };
		
	// 	// console.log(characterData);

	// 	// var characterView = new CharacterView(characterData, this.characters, this.charactersDialogView);
	// 	// characterView.attachTo(this.characterCollectionElem);
	// 	// characterView.on('validate', function() {
	// 	// 	if (self.isValid()) {
	// 	// 		self.wrapElem.classList.add('hidden');
	// 	// 		self.trigger('status:validate');
	// 	// 	} else {
	// 	// 		self.wrapElem.classList.remove('hidden');
	// 	// 		self.trigger('status:invalidate');
	// 	// 	}
	// 	// });
	// 	// characterView.on('invalidate', function() {
	// 	// 	if (self.isValid()) {
	// 	// 		self.wrapElem.classList.add('hidden');
	// 	// 		self.trigger('status:validate');
	// 	// 	} else {
	// 	// 		self.wrapElem.classList.remove('hidden');
	// 	// 		self.trigger('status:invalidate');
	// 	// 	}
	// 	// });
	// 	// this.characterViewCollection.push(characterView);
	// };
	// EditPageView.prototype._parseLayerTypeCustomImage = function(rootElem) {
	// 	var layerImageElems = rootElem.getElementsByClassName('layerType_customImg');
	// 	var photoUrls = [];
	// 	for (var i = 0; i < layerImageElems.length; i++) {
	// 		photoUrls.push(layerImageElems[i].src);
	// 	}
	// 	this.imageSelectDialogView.updatePreloadedImages(photoUrls);
	// 	if (layerImageElems.length === 0) {
	// 		this.imagesElem.classList.add('hidden');
	// 	} else {
	// 		this.imagesElem.classList.remove('hidden');
	// 		for (var i = 0; i < layerImageElems.length; i++) {
	// 			this._createLayerTypeCustomImage(layerImageElems[i]);
	// 		}
	// 	}
	// };
	// EditPageView.prototype._createLayerTypeCustomImage = function(layerImageElem) {
	// 	var imageItemView = new ImageItemView(layerImageElem, this.imageSelectDialogView);
	// 	imageItemView.attachTo(this.imagesCollectionElem);
	// 	this.imageItemViewCollection.push(imageItemView);
	// };
	// EditPageView.prototype.isValid = function() {
	// 	var valid = true;
	// 	for (var i = 0; i < this.characterViewCollection.length; i++) {
	// 		valid = this.characterViewCollection[i].isValid();
	// 		if (!valid) {
	// 			break;
	// 		}
	// 	}
	// 	return valid;
	// };
	// EditPageView.prototype.validate = function() {
	// 	this.characterViewCollection.forEach(function(view) {
	// 		view.validate();
	// 	});
	// };
	// EditPageView.prototype.reset = function() {
	// 	this.characterViewCollection.forEach(function(view) {
	// 		view.reset();
	// 	});
	// };
	// EditPageView.prototype.setCharacters = function(characters) {
	// 	var self = this;
	// 	this.characters	= characters;
	// 	this.characters.forEach(function(character) {
	// 		self.charactersDialogView.addCharacterItem(character);	
	// 	});
	// };
	// EditPageView.prototype.getData = function() {
	// 	var data = [];
	// 	this.characterViewCollection.forEach(function(view) {
	// 		if (!view.isValid()) {
	// 			data.push(view.getData());
	// 		}
	// 	});
	// 	return data;
	// };
	// EditPageView.prototype.formatMeta = function(dataItem) {
	// 	var commandChunks = [];
	// 	var replies = dataItem.replies;
	// 	replies.forEach(function(reply) {
	// 		commandChunks.push(reply.hint);
	// 		commandChunks.push(reply.phrase);
	// 	});
	// 	commandChunks.push(dataItem.const);

	// 	var meta = {
	// 		layer: dataItem.layer,
	// 		actors: dataItem.actors,
	// 		commands: commandChunks.join(''),
	// 		type: dataItem.type,
	// 		url: dataItem.layer.src
	// 	};

	// 	return meta;
	// };
	// EditPageView.prototype.requestAnimationAsync = function(meta) {
	// 	var commandChunks = [];

	// 	commandChunks.push('<?xml version="1.0"?><commands version="1.0.0"><');
	// 	commandChunks.push(meta.type);
	// 	commandChunks.push('>');
	// 	commandChunks.push(meta.commands);
	// 	commandChunks.push('</');
	// 	commandChunks.push(meta.type);
	// 	commandChunks.push('></commands>');

	// 	meta.layer.src = '';

	// 	var requestData = {
	// 		input: {
	// 			id: uuid.v4(),
	// 			destination: 'separate',
	// 			commands: commandChunks.join(''),
	// 			actors: meta.actors
	// 		}
	// 	};
		
	// 	console.log(requestData);

	// 	var url = settings.animationServiceUrl;
	// 	var data = 'type=build&data=' + encodeURIComponent(JSON.stringify(requestData));

	// 	return async.requestAsync({
	// 		url: url,
	// 		data: data,
	// 		method: 'POST',
	// 		headers: [{
	// 			key: 'Content-Type',
	// 			value: 'text/html'
	// 		}]
	// 	});
	// };
	
	messenger.views = messenger.views || {};
	
	messenger.views.AnswerPageView = AnswerPageView;
	messenger.views.SelectPageView = SelectPageView;
	
})(messenger, abyss, template, settings, uuid, async, Q, html, analytics, filmlang);