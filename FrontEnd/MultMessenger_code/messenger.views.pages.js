var messenger = messenger || {};

(function(messenger, abyss, template, settings, uuid, async, Q, html, analytics) {
	
	var View = abyss.View;
	
	var MessageEditorView = messenger.views.MessageEditorView;
	var ContactView = messenger.views.ContactView;
	var CharacterView = messenger.views.CharacterView;

	var UpdateMessageDialogView = messenger.views.UpdateMessageDialogView;
	var CharactersDialogView = messenger.views.CharactersDialogView;

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
	
	var SelectPageView = function() {
		SelectPageView.super.apply(this);
		var self = this;

		this.elem = template.create('select-page-template', { id: 'select-page' });
		this.patternsElem = this.elem.getElementsByClassName('patterns')[0];
		this.loadHolderElem = this.elem.getElementsByClassName('load-holder')[1];
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
				analytics.send('message', 'change');
			}
		};
		
		var loadElemClickListener = function(event) {
			if (self.loadElemEnable) {
				self.trigger({
					type: 'click:load'
				});
				analytics.send('message', 'load');
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
			// var dx = -(event.wheelDeltaX || 0);
			// var dy = -(event.wheelDeltaY || event.wheelDelta || 0);
			// if (event.detail !== null) {
			// 	if (event.axis == event.HORIZONTAL_AXIS) {
			// 		dx = event.detail;
			// 	} else if (event.axis == event.VERTICAL_AXIS) {
			// 		dy = event.detail;
			// 	}
			// }
			// if (dx) {
			// 	var ndx = Math.round(html.normalizeWheelDelta(dx));
			// 	if (!ndx) {
			// 		ndx = dx > 0 ? 1 : -1;
			// 	}
			// 	self.containerElem.scrollLeft += ndx;
			// }
			// if (dy) {
			// 	var ndy = Math.round(html.normalizeWheelDelta(dy));
			// 	if (!ndy) {
			// 		ndy = dy > 0 ? 1 : -1;
			// 	}
			// 	self.containerElem.scrollTop += ndy;
			// }
			// if (dx || dy) {
			// 	event.preventDefault();
			// 	event.stopPropagation();
			// }
		};
		
		this.loadElem.addEventListener('click', loadElemClickListener);
		this.preloadElem.addEventListener('click', preloadElemClickListener);
		this.containerElem.addEventListener('DOMMouseScroll', wheelListener, false);
		this.containerElem.addEventListener('mousewheel', wheelListener, false);
		
		this.once('dispose', function(event) {
			self.loadElem.removeEvent('click', loadElemClickListener);
			self.preloadElem.removeEventListener('click', preloadElemClickListener);
			self.containerElem.removeEventListener('DOMMouseScroll', wheelListener);
			self.containerElem.removeEventListener('mousewheel', wheelListener);
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
		this.wrapElem = this.messageWrapperElem.getElementsByClassName('wrap')[0];
		this.memosElem = this.elem.getElementsByClassName('memos')[0];
		this.characterCollectionElem = this.elem.getElementsByClassName('character-collection')[0];
		
		this.messageEditorView = new MessageEditorView();
		this.messageEditorView.attachFirstTo(this.messageWrapperElem);

		this.updateMessageDialogView = new UpdateMessageDialogView();
		this.updateMessageDialogView.on('click:close', function() {

		});
		
		this.charactersDialogView = new CharactersDialogView();

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
			analytics.send('message', 'update', 'canceled');
		});
		this.updateElem.addEventListener('click', function() {
			var data = self.getData();
			var metas = data.map(self.formatMeta);
			var requests = metas.map(function(meta) {
				return Q.all([meta, self.requestAnimationAsync(meta)]);
			});
			Q.all(requests).then(function(values) {
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
				analytics.send('message', 'update', 'success');
			}).catch(function() {
				self.updateMessageDialogView.setMode('fail');
				analytics.send('message', 'update', 'failed');
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
		this.wrapElem.classList.add('hidden');
		this.characterCollectionElem.innerHTML = '';
		this.characterViewCollection = [];
	};
	EditPageView.prototype._parseLayerTypeText = function(rootElem) {
		var textElements = rootElem.getElementsByClassName('layerType_text');
		textElements = Array.prototype.slice.call(textElements, 0);
		textElements = textElements.sort(function(elem1, elem2) {
			var zIndex1 = parseInt(elem1.style.zIndex, 10);
			var zIndex2 = parseInt(elem2.style.zIndex, 10);
			if (zIndex1 > zIndex2) {
				return -1;
			} else if (zIndex1 <= zIndex2) {
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
			analytics.send('message', 'edit', 'text');
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

		var characterView = new CharacterView(characterData, this.characters, this.charactersDialogView);
		characterView.attachTo(this.characterCollectionElem);
		characterView.on('validate', function() {
			if (self.isValid()) {
				self.wrapElem.classList.add('hidden');
				self.trigger('status:validate');
			} else {
				self.wrapElem.classList.remove('hidden');
				self.trigger('status:invalidate');
			}
		});
		characterView.on('invalidate', function() {
			if (self.isValid()) {
				self.wrapElem.classList.add('hidden');
				self.trigger('status:validate');
			} else {
				self.wrapElem.classList.remove('hidden');
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
		var self = this;
		this.characters	= characters;
		this.characters.forEach(function(character) {
			self.charactersDialogView.addCharacterItem(character);	
		});
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
				analytics.send('contact', 'change');
			}
		};
		
		var loadElemClickListener = function(event) {
			if (self.loadElemEnable) {
				self.trigger('click:load');
				analytics.send('contant', 'load');
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
					analytics.send('contact', 'search');
				}, 800);
			}
		};
		var wheelListener = function(event) {
			var dx = -(event.wheelDeltaX || 0);
			var dy = -(event.wheelDeltaY || event.wheelDelta || 0);
			if (event.detail !== null) {
				if (event.axis == event.HORIZONTAL_AXIS)  {
					dx = event.detail;
				} else if (event.axis == event.VERTICAL_AXIS) {
					dy = event.detail;
				}
			}
			if (dx) {
				var ndx = Math.round(html.normalizeWheelDelta(dx));
				if (!ndx) ndx = dx > 0 ? 1 : -1;
				self.searchResultsWrapElem.scrollLeft += ndx;
			}
			if (dy) {
				var ndy = Math.round(html.normalizeWheelDelta(dy));
				if (!ndy) ndy = dy > 0 ? 1 : -1;
				self.searchResultsWrapElem.scrollTop += ndy;
			}
			if (dx || dy) { 
				event.preventDefault();
				event.stopPropagation(); 
			}
		};
		
		this.loadElem.addEventListener('click', loadElemClickListener);
		this.queryElem.addEventListener('input', queryElemInputListener);
		this.searchResultsWrapElem.addEventListener('DOMMouseScroll', wheelListener, false);
		this.searchResultsWrapElem.addEventListener('mousewheel', wheelListener, false);
		
		this.once('dispose', function(event) {
			self.loadElem.removeEventListener('click', loadElemClickListener);
			self.queryElem.removeEventListener('input', queryElemInputListener);
			self.searchResultsWrapElem.addEventListener('DOMMouseScroll', wheelListener);
			self.searchResultsWrapElem.addEventListener('mousewheel', wheelListener);
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
	
	messenger.views = messenger.views || {};
	
	messenger.views.AnswerPageView = AnswerPageView;
	messenger.views.SelectPageView = SelectPageView;
	messenger.views.EditPageView = EditPageView;
	messenger.views.PostPageView = PostPageView;
	
})(messenger, abyss, template, settings, uuid, async, Q, html, analytics);