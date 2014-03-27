(function(messenger, eve, abyss, template, filmlang, settings, analytics) {
	
	var PageView = messenger.views.PageView;
	var MessageEditorView = messenger.views.MessageEditorView;
	var ImageItemView = messenger.views.ImageItemView;
	
	var DialogView = messenger.views.DialogView;
	var UpdateMessageDialogView = messenger.views.UpdateMessageDialogView;
	var CharactersDialogView = messenger.views.CharactersDialogView;
	var ImageSelectDialogView = messenger.views.ImageSelectDialogView;
	
	var FilmText = filmlang.FilmText;
	
	var EditPageView = (function(base) {
		eve.extend(EditPageView, base);
		
		function EditPageView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('edit-page-template', { id: 'edit-page' });
			this.resetElem = this.elem.getElementsByClassName('reset')[0];
			this.updateElem = this.elem.getElementsByClassName('update')[0];
			this.messageWrapperElem = this.elem.getElementsByClassName('message-wrapper')[0];
			this.wrapElem = this.messageWrapperElem.getElementsByClassName('wrap')[0];
			
			this.memosElem = this.elem.getElementsByClassName('memos')[0];
			this.memosSectionElem = this.memosElem.getElementsByClassName('section')[0];
			this.memosCollectionElem = this.memosElem.getElementsByClassName('collection')[0];
			
			this.imagesElem = this.elem.getElementsByClassName('images')[0];
			this.imagesSectionElem = this.imagesElem.getElementsByClassName('section')[0];
			this.imagesCollectionElem = this.imagesElem.getElementsByClassName('collection')[0];
	
			this.characterCollectionElem = this.elem.getElementsByClassName('character-collection')[0];
			
			this.imageItemViewCollection = [];
	
			this.updateMessageDialogView = new UpdateMessageDialogView();
			this.imageSelectDialogView = new ImageSelectDialogView();
			this.charactersDialogView = new CharactersDialogView();
			this.gagsDialogView = new GagsDialogView();
			this.moodsDialogView = new MoodsDialogView();
			this.actionsDialogView = new ActionsDialogView();
			
			this.characters = [];
			this.filmTexts = [];
			
			this.messageEditorView = new MessageEditorView();
			this.messageEditorView.attachFirstTo(this.messageWrapperElem);
			this.messageEditorView.on('change:content', function(event) {
				var elem = event.elem;
				self.clear();
				self._parseLayerTypeText(elem);
				self._parseLayerTypeCustomImage(elem);
				self._parseLayerTypeActor(elem);
			});
			
			this.validateListener = function() {
				var isInvalid = true;
				self.filmTexts.forEach(function(filmText) {
					isInvalid = isInvalid || !filmText.isValid;		
				});
				if (isInvalid) {
					self.wrapElem.classList.add('hidden');
				} else {
					self.wrapElem.classList.remove('hidden');
				}
			};
			
			this.resetElem.addEventListener('click', function() {
				self.filmTexts.forEach(function(filmText) {
					filmText.reset();
				});
				analytics.send('editor', 'update_cancel');
			});
			
			this.elem.getElementsByClassName('test')[0].addEventListener('click', function() {
				self.moodsDialogView.show();
			});
		}
		
		EditPageView.prototype.setCharacters = function(characters) {
			var self = this;
			this.characters	= characters;
			this.characters.forEach(function(character) {
				self.charactersDialogView.addCharacterItem(character);	
			});
		};
		EditPageView.prototype.setMessage = function(message) {
			this.messageEditorView.setModel(message);
			this.trigger('status:validate');
		};
		EditPageView.prototype.reset = function() {
			
		};
		EditPageView.prototype.clear = function() {
			this.wrapElem.classList.add('hidden');
		
			this.memosCollectionElem.innerHTML = '';
			
			this.imageItemViewCollection.forEach(function(view) {
				view.dispose();
			});
			this.imagesCollectionElem.innerHTML = '';
			this.imagesElem.classList.add('hidden');
			this.imageItemViewCollection = [];
			
			this.filmTexts.forEach(function(filmText) {
				filmText.dispose();	
			});
			this.filmTexts = [];
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
				analytics.send('editor', 'edit_caption');
			});
	
			this.memosCollectionElem.appendChild(elem);
		};
		EditPageView.prototype._parseLayerTypeCustomImage = function(rootElem) {
			var layerImageElems = rootElem.getElementsByClassName('layerType_customImg');
			var photoUrls = [];
			for (var i = 0; i < layerImageElems.length; i++) {
				photoUrls.push(layerImageElems[i].src);
			}
			this.imageSelectDialogView.updatePreloadedImages(photoUrls);
			if (layerImageElems.length === 0) {
				this.imagesElem.classList.add('hidden');
			} else {
				this.imagesElem.classList.remove('hidden');
				for (var i = 0; i < layerImageElems.length; i++) {
					this._createLayerTypeCustomImage(layerImageElems[i]);
				}
			}
		};
		EditPageView.prototype._createLayerTypeCustomImage = function(layerImageElem) {
			var imageItemView = new ImageItemView(layerImageElem, this.imageSelectDialogView);
			imageItemView.attachTo(this.imagesCollectionElem);
			this.imageItemViewCollection.push(imageItemView);
		};
		EditPageView.prototype._parseLayerTypeActor = function(rootElem) {
			var actorElements = rootElem.getElementsByClassName('layerType_actor');
			for (var i = 0; i < actorElements.length; i++) {
				this._createFilmTextView(actorElements[i]);
			}
		};
		EditPageView.prototype._createFilmTextView = function(actorElem) {
			var meta = actorElem.dataset.meta;
			var filmText = new FilmText(meta);
			var filmTextView = new FilmTextView(filmText);
			
			filmText.on('validate', this.validateListener);
			filmText.on('invalidate', this.validateListener);
			filmText.on('dispose', function() {
				
			});
			this.filmTexts.push(filmText);
			
			console.log(filmText);
		};
		
		return EditPageView;
	})(PageView);
	
	var FilmTextView = (function(base) {
		eve.extend(FilmTextView, base);
		
		function FilmTextView(model) {
			base.apply(this, arguments);
			
			this.model = model;
		}
		
		return FilmTextView;
	})(abyss.View);
	
	var MoodItemView = (function(base) {
		eve.extend(MoodItemView, base);
		
		function MoodItemView(mood) {
			base.apply(this, arguments);
			
			this.elem = template.create('mood-item-template', { className: 'mood-item' });
			this.elem.classList.add('normal');
			this.iconElem = this.elem.getElementsByClassName('icon')[0];
			
			this.iconElem.textContent = mood.icon;
			this.iconElem.classList.add(mood.value);
		}
		
		return MoodItemView;
	})(abyss.View);
	
	var MoodsDialogView = (function(base) {
		eve.extend(MoodsDialogView, base);
		
		function MoodsDialogView() {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById('moods-dialog');
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			this.contentElem = this.dialogWindowElem.getElementsByClassName('content')[0];
			
			this.moodItemViews = [];
			this.initializeMoodItemViews();
			
			
			var crossElementClickListener = function(event) {
				self.hide();
			};
			
			this.crossElem.addEventListener('click', crossElementClickListener);
			
			this.once('dispose', function() {
				self.crossElem.removeEventListener('click', crossElementClickListener);
			});
		}
		
		MoodsDialogView.prototype.initializeMoodItemViews = function() {
			this.addMoodItemView({ icon: ':-|', value: 'calm' });
			this.addMoodItemView({ icon: '>:(', value: 'angry' });
			this.addMoodItemView({ icon: ':-(', value: 'sad' });
			this.addMoodItemView({ icon: ':-)', value: 'happy' });
			this.addMoodItemView({ icon: ':-0', value: 'amaze' });
		};
		MoodsDialogView.prototype.addMoodItemView = function(mood) {
			var moodItemView = new MoodItemView(mood);
			moodItemView.attachTo(this.contentElem);
			this.moodItemViews.push(moodItemView);
		};
		
		return MoodsDialogView;
		
	})(DialogView);
	
	var GagsDialogView = (function(base) {
		eve.extend(GagsDialogView, base);
		
		function GagsDialogView() {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById('gags-dialog');
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			
			var crossElementClickListener = function(event) {
				self.hide();	
			};
			
			this.crossElem.addEventListener('click', crossElementClickListener);
			
			this.once('dispose', function() {
				self.crossElem.removeEventListener('click', crossElementClickListener);
			});
		}
		
		return GagsDialogView;
	})(DialogView);
	
	var ActionsDialogView = (function(base) {
		eve.extend(ActionsDialogView, base);
		
		function ActionsDialogView() {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById('actions-dialog');
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			
			var crossElementClickListener = function(event) {
				self.hide();	
			};
			
			this.crossElem.addEventListener('click', crossElementClickListener);
			
			this.once('dispose', function() {
				self.crossElem.removeEventListener('click', crossElementClickListener);
			});
		}
		
		return ActionsDialogView;
	})(DialogView);
	
	messenger.views.EditPageView = EditPageView;
	
})(messenger, eve, abyss, template, filmlang, settings, analytics);
