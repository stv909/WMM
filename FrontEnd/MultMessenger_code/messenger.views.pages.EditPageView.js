(function(messenger, eve, abyss, template, filmlang, data, settings, analytics) {
	
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
			
			this.elem.getElementsByClassName('test1')[0].addEventListener('click', function() {
				self.moodsDialogView.show();
			});
			this.elem.getElementsByClassName('test2')[0].addEventListener('click', function() {
				self.gagsDialogView.show();	
			});
			this.elem.getElementsByClassName('test3')[0].addEventListener('click', function() {
				self.actionsDialogView.show();
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
				//kill views
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
	
	var ItemView = (function(base) {
		eve.extend(ItemView, base);
		
		function ItemView(model) {
			base.apply(this, arguments);
			this.selected = false;
			this.model = model;
		}
		
		ItemView.prototype.select = function() {
			this.elem.classList.add('chosen');
			this.elem.classList.remove('normal');
			this.selected = true;
		};
		ItemView.prototype.deselect = function() {
			this.elem.classList.remove('chosen');
			this.elem.classList.add('normal');
			this.selected = false;
		};
		
		return ItemView;
	})(abyss.View);
	
	var MoodItemView = (function(base) {
		eve.extend(MoodItemView, base);
		
		function MoodItemView(model) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('mood-item-template', { className: 'mood-item' });
			this.iconElem = this.elem.getElementsByClassName('icon')[0];
			
			this.iconElem.textContent = model.icon;
			this.iconElem.classList.add(model.value);
			
			this.deselect();
			
			var elemClickListener = function(event) {
				if (!self.selected) {
					self.select();
				}
			};
			
			this.elem.addEventListener('click', elemClickListener);
			this.once('dispose', function() {
				self.elem.removeEventListener('click', elemClickListener);	
			});
		}
		
		MoodItemView.prototype.select = function(silent) {
			base.prototype.select.apply(this, arguments);
			if (!silent) {
				this.trigger({
					type: 'select:mood',
					mood: this.model
				});
			}
		};
		
		return MoodItemView;
	})(ItemView);
	
	var GagItemView = (function(base) {
		eve.extend(GagItemView, base);
		
		function GagItemView(model) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('gag-item-template', { className: 'gag-item' });
			
			this.deselect();
			
			var elemClickListener = function(event) {
				if (!self.selected) {
					self.select();
				}
			};
			
			this.elem.addEventListener('click', elemClickListener);
			this.once('dispose', function() {
				self.elem.removeEventListener('click', elemClickListener);
			});
		}
		
		GagItemView.prototype.select = function(silent) {
			base.prototype.select.apply(this, arguments);
			if (!silent) {
				this.trigger({
					type: 'select:gag',
					gag: this.model
				});
			}
		};
		
		return GagItemView;
	})(ItemView);
	
	var ActionItemView = (function(base) {
		eve.extend(ActionItemView, base);
		
		function ActionItemView(model) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('action-item-template', { className: 'action-item' });
			
			this.deselect();
			
			var elemClickListener = function(event) {
				if (!self.selected) {
					self.select();
				}
			};
			
			this.elem.addEventListener('click', elemClickListener);
			this.once('dispose', function() {
				self.elem.removeEventListener('click', elemClickListener);
			});
		}
		
		ActionItemView.prototype.select = function(silent) {
			base.prototype.select.apply(this, arguments);
			if (!silent) {
				this.trigger({
					type: 'select:gag',
					action: this.model
				});
			}
		};
		
		return ActionItemView;
	})(ItemView);
	
	var MoodsDialogView = (function(base) {
		eve.extend(MoodsDialogView, base);
		
		function MoodsDialogView() {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById('moods-dialog');
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			this.contentElem = this.dialogWindowElem.getElementsByClassName('content')[0];
			
			this.moodItemViews = {};
			this.moodItemViewSelectListener = function(event) {
				var mood = event.mood;
				self.trigger({
					type: 'select:mood',
					mood: mood
				});
				self.hide();
			};
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
			data.MoodCollection.forEach(function(mood) {
				this.addMoodItemView(mood);
			}, this);
		};
		MoodsDialogView.prototype.addMoodItemView = function(mood) {
			var moodItemView = new MoodItemView(mood);
			moodItemView.attachTo(this.contentElem);
			moodItemView.on('select:mood', this.moodItemViewSelectListener);
			this.moodItemViews[mood.value] = moodItemView;
		};
		MoodsDialogView.prototype.show = function(moodValue) {
			base.prototype.show.apply(this, arguments);
			Object.keys(this.moodItemViews).forEach(function(key) {
				this.moodItemViews[key].deselect();
			}, this);
			var moodItemView = this.moodItemViews[moodValue];
			if (moodItemView) {
				moodItemView.select(true);
			}
		};
		MoodsDialogView.prototype.hide = function() {
			base.prototype.hide.apply(this, arguments);
			this.off('select:mood');
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
			this.contentElem = this.dialogWindowElem.getElementsByClassName('content')[0];
			
			this.gagItemViews = {};
			this.gagItemViewSelectListener = function(event) {
				var gag = event.gag;
				self.trigger({
					type: 'select:gag',
					gag: gag
				});
				self.hide();
			};
			this.initializeGagItemViews();
			
			var crossElementClickListener = function(event) {
				self.hide();	
			};
			
			this.crossElem.addEventListener('click', crossElementClickListener);
			
			this.once('dispose', function() {
				self.crossElem.removeEventListener('click', crossElementClickListener);
			});
		}
		
		GagsDialogView.prototype.initializeGagItemViews = function() {
			data.GagCollection.forEach(function(gag) {
				this.addGagItemView(gag);
			}, this);
		};
		GagsDialogView.prototype.addGagItemView = function(gag) {
			var gagItemView = new GagItemView(gag);
			gagItemView.attachTo(this.contentElem);
			gagItemView.on('select:gag', this.gagItemViewSelectListener);
			this.gagItemViews[gag.value] = gagItemView;
		};
		GagsDialogView.prototype.show = function(gagValue) {
			base.prototype.show.apply(this, arguments);
			Object.keys(this.gagItemViews).forEach(function(key) {
				this.gagItemViews[key].deslect();	
			}, this);
			var gagItemView = this.gagItemViews[gagValue];
			if (gagItemView) {
				gagItemView.select(true);
			}
		};
		GagsDialogView.prototype.hide = function() {
			base.prototype.hide.apply(this, arguments);
			this.off('select:gag');
		};
		
		return GagsDialogView;
	})(DialogView);
	
	var ActionsDialogView = (function(base) {
		eve.extend(ActionsDialogView, base);
		
		function ActionsDialogView() {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById('actions-dialog');
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			this.contentElem = this.dialogWindowElem.getElementsByClassName('content')[0];
			
			this.actionItemViews = {};
			this.actionItemViewSelectListener = function(event) {
				var action = event.action;
				self.trigger({
					type: 'select:action',
					action: action
				});
				self.hide();
			};
			this.initializeActionItemViews();
			
			var crossElementClickListener = function(event) {
				self.hide();
			};
			
			this.crossElem.addEventListener('click', crossElementClickListener);
			
			this.once('dispose', function() {
				self.crossElem.removeEventListener('click', crossElementClickListener);
			});
		}
		
		ActionsDialogView.prototype.initializeActionItemViews = function() {
			data.ActionCollection.forEach(function(action) {
				this.addActionItemView(action);
			}, this);
		};
		ActionsDialogView.prototype.addActionItemView = function(action) {
			var actionItemView = new ActionItemView(action);
			actionItemView.attachTo(this.contentElem);
			actionItemView.on('select:action', this.actionItemViewSelectListener);
			this.actionItemViews[action.value] = actionItemView;
		};
		ActionsDialogView.prototype.show = function(actionValue) {
			base.prototype.show.apply(this, arguments);
			Object.keys(this.actionItemViews).forEach(function(key) {
				this.actionItemViews[key].deselect();
			}, this);
			var actionItemView = this.actionItemViews[actionValue];
			if (actionItemView) {
				actionItemView.select(true);
			}
		};
		ActionsDialogView.prototype.hide = function() {
			base.prototype.hide.apply(this, arguments);
			this.off('select:action');
		};
		
		return ActionsDialogView;
	})(DialogView);
	
	messenger.views.EditPageView = EditPageView;
	
})(messenger, eve, abyss, template, filmlang, data, settings, analytics);
