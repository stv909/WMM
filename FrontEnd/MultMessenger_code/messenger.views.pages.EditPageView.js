(function(messenger, eve, abyss, template, filmlang, data, settings, analytics, Q, async) {
	
	var PageView = messenger.views.PageView;
	var MessageEditorView = messenger.views.MessageEditorView;
	var ImageItemView = messenger.views.ImageItemView;
	
	var DialogView = messenger.views.DialogView;
	var UpdateMessageDialogView = messenger.views.UpdateMessageDialogView;
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
	
			this.textsElem = this.elem.getElementsByClassName('texts')[0];
			
			this.imageItemViewCollection = [];
	
			this.updateMessageDialogView = new UpdateMessageDialogView();
			this.imageSelectDialogView = new ImageSelectDialogView();
			this.charactersDialogView = new CharactersDialogView();
			this.gagsDialogView = new GagsDialogView();
			this.moodsDialogView = new MoodsDialogView();
			this.actionsDialogView = new ActionsDialogView();
			this.animationTypesDialogView = new AnimationTypesDialogView();
			
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
				var isInvalid = false;
				self.filmTexts.forEach(function(filmText) {
					isInvalid = isInvalid || !filmText.isValid;		
				});
				if (isInvalid) {
					self.wrapElem.classList.remove('hidden');
					self.trigger('status:invalidate');
				} else {
					self.wrapElem.classList.add('hidden');
					self.trigger('status:validate');
				}
			};
			
			this.resetElem.addEventListener('click', function() {
				self.filmTexts.forEach(function(filmText) {
					filmText.reset();
				});
				analytics.send('editor', 'update_cancel');
			});
			this.updateElem.addEventListener('click', function() {
				var invalidFilmTexts = self.filmTexts.filter(function(filmText) {
					return !filmText.isValid;
				});
				var requestPairs = invalidFilmTexts.map(function(filmText) {
					var request = async.requestAsync({
						url: settings.animationServiceUrl,
						data: filmText.toAnimationRequestData(),
						method: 'POST',
						headers: [{
							key: 'Content-Type',
							value: 'text/html'
						}]
					});
					return Q.all([filmText, request]);
				});
				
				Q.all(requestPairs).then(function(values) {
					values.forEach(function(value) {
						var filmText = value[0];
						var rawResponse = value[1];
						var response = JSON.parse(rawResponse);
						var actorElem = filmText.actorElem;
						actorElem.src = settings.layerImageStoreBaseUrl + response.output.images[0];
						actorElem.dataset.meta = JSON.stringify(filmText.toMeta());
						filmText.validate();
					});
					self.updateMessageDialogView.setMode('complete');
					analytics.send('editor', 'edit_update', 'success');
				}).catch(function(error) {
					console.log(error);
					self.updateMessageDialogView.setMode('fail');
					analytics.send('editor', 'edit_update', 'fail');
				});
				self.updateMessageDialogView.show();
			});
		}
		
		EditPageView.prototype.setMessage = function(message) {
			this.messageEditorView.setModel(message);
			this.trigger('status:validate');
		};
		EditPageView.prototype.reset = function() {
			this.filmTexts.forEach(function(filmText) {
				filmText.reset();
			});
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
			var filmText = new FilmText(meta, actorElem);
			var filmTextView = new FilmTextView(filmText,
				this.charactersDialogView,
				this.animationTypesDialogView,
				this.gagsDialogView,
				this.actionsDialogView,
				this.moodsDialogView);
			
			filmTextView.attachTo(this.textsElem);
			filmText.on('validate', this.validateListener);
			filmText.on('invalidate', this.validateListener);
			filmText.once('dispose', function() {
				filmTextView.dispose();
			});
			this.filmTexts.push(filmText);
		};
		
		return EditPageView;
	})(PageView);
	
	var FilmTextView = (function(base) {
		eve.extend(FilmTextView, base);
		
		function FilmTextView(model, charactersDialogView, animationTypesDialogView, gagsDialogView, actionsDialogView, moodsDialogView) {
			base.apply(this, arguments);
			var self = this;
			
			this.model = model;
			this.charactersDialogView = charactersDialogView;
			this.animationTypesDialogView = animationTypesDialogView;
			this.gagsDialogView = gagsDialogView;
			this.actionsDialogView = actionsDialogView;
			this.moodsDialogView = moodsDialogView;
			
			this.elem = template.create('film-text-template', { className: 'film-text' });
			this.characterHolderElem = this.elem.getElementsByClassName('character-holder')[0];
			this.filmTextItemsElem = this.elem.getElementsByClassName('film-text-items')[0];
			
			this.initializeViews();
		}
		
		FilmTextView.prototype.initializeViews = function() {
			this._createCharacterView();
			
			this.model.commandItems.forEach(function(commandItem) {
				switch (commandItem.type) {
					case '#text':
						this._createTextView(commandItem);
						break;
					case 'gag':
						this._createGagView(commandItem);
						break;
					case 'action':
						this._createActionView(commandItem);
						break;
					case 'mood':
						this._createMoodView(commandItem);
						break;
					default:
						break;
				}
			}, this);
		};
		FilmTextView.prototype._createCharacterView = function() {
			var actorItem = this.model.actorItems[0];
			var characterView = new CharacterView(actorItem, this.charactersDialogView);
			
			characterView.attachTo(this.characterHolderElem);
			actorItem.once('dispose', function() {
				characterView.dispose();
			});
		};
		FilmTextView.prototype._createAnimationTypeView = function() {
			var typeItem = this.model.typeItem;
		};
		FilmTextView.prototype._createTextView = function(commandItem) {
			
		};
		FilmTextView.prototype._createMoodView = function(commandItem) {
			
		};
		FilmTextView.prototype._createGagView = function(commandItem) {
			
		};
		FilmTextView.prototype._createActionView = function(commandItem) {
			
		};
		
		return FilmTextView;
	})(abyss.View);
	
	var CharacterView = (function(base) {
		eve.extend(CharacterView, base);
		
		function CharacterView(model, charactersDialogView) {
			base.apply(this, arguments);
			var self = this;
			
			this.model = model;
			this.charactersDialogView = charactersDialogView;
			
			this.elem = template.create('character-template', { className: 'character' });
			this.characterImageElem = this.elem.getElementsByClassName('character-image')[0];
			this.characterNameElem = this.elem.getElementsByClassName('character-name')[0];

			var character = data.CharacterCollection[this.model.value.character];
			this.bindData(character);
			
			this.model.on('validate', function(event) {
				var value = event.value;
				var character = data.CharacterCollection[value.character];
				self.elem.classList.remove('invalid');
				self.bindData(character);
			});
			this.model.on('invalidate', function(event) {
				var value = event.value;
				var character = data.CharacterCollection[value.character];
				self.elem.classList.add('invalid');
				self.bindData(character);
			});
			
			var elemClickListener = function(event) {
				self.charactersDialogView.once('select:item', function(event) {
					var item = event.item;
					var value = {
						name: self.model.value.name,
						character: item.value
					};
					self.model.setValue(value);
				});
				self.charactersDialogView.show(self.model.value.character);
			};
			
			this.elem.addEventListener('click', elemClickListener);
			this.once('dispose', function() {
				self.elem.removeEventListener('click', elemClickListener);
			});
		}
		
		CharacterView.prototype.bindData = function(character) {
			this.characterImageElem.src = character.image;
			this.characterNameElem.textContent = character.value;
		};
		
		return CharacterView;
	})(abyss.View);
	
	var AnimationTypeView = (function(base) {
		eve.extend(AnimationTypeView, base);
		
		function AnimationTypeView(model, animationTypesDialogView) {
			base.apply(this, arguments);
		}
		
		return AnimationTypeView;
	})(abyss.View);
	
	var TextView = (function(base) {
		eve.extend(TextView, base);
		
		function TextView(model) {
			base.apply(this, arguments);
			
			this.model = model;
			this.elem = document.createElement('input');
			this.elem.type = 'text';
			this.elem.className = this.model.value;
			
			this.once('dispose', function() {
				
			});
		}
		
		return TextView;
	})(abyss.View);
	
	var GagView = (function(base) {
		eve.extend(GagView, base);
		
		function GagView(model, gagsDialogView) {
			base.apply(this, arguments);
		}
		
		return GagView;
	})(abyss.View);
	
	var ActionView = (function(base) {
		eve.extend(ActionView, base);
		
		function ActionView(model, actionsDialogView) {
			base.apply(this, arguments);
		}
		
		return ActionView;	
	})(abyss.View);
	
	var MoodView = (function(base) {
		eve.extend(MoodView, base);
		
		function MoodView(model, moodsDialogView) {
			base.apply(this, arguments);
		}
		
		return MoodView;
	})(abyss.View)
	
	var ItemView = (function(base) {
		eve.extend(ItemView, base);
		
		function ItemView(model, itemName) {
			base.apply(this, arguments);
			
			var self = this;
			var templateName = [itemName, 'template'].join('-');
			
			this.elem = template.create(templateName, { className: itemName });
			this.selected = false;
			this.model = model;
			this.deselect();
			this.bindData();
			
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
		
		ItemView.prototype.select = function(silent) {
			this.elem.classList.add('chosen');
			this.elem.classList.remove('normal');
			this.selected = true;
			if (!silent) {
				this.trigger({
					type: 'select',
					model: this.model
				});
			}
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
			base.call(this, model, 'mood-item');
		}
		
		MoodItemView.prototype.bindData = function() {
			this.iconElem = this.elem.getElementsByClassName('icon')[0];
			this.iconElem.textContent = this.model.icon;
			this.iconElem.classList.add(this.model.value);
		};
		
		return MoodItemView;
	})(ItemView);
	
	var GagItemView = (function(base) {
		eve.extend(GagItemView, base);
		
		function GagItemView(model) {
			base.call(this, model, 'gag-item');
		}
		
		GagItemView.prototype.bindData = function() {
			this.elem.textContent = this.model.text;	
		};
		
		return GagItemView;
	})(ItemView);
	
	var ActionItemView = (function(base) {
		eve.extend(ActionItemView, base);
		
		function ActionItemView(model) {
			base.call(this, model, 'action-item');
		}
		
		ActionItemView.prototype.bindData = function() {
			this.elem.textContent = this.model.text;
		};
		
		return ActionItemView;
	})(ItemView);
	
	var AnimationTypeItemView = (function(base) {
		eve.extend(AnimationTypeItemView, base)
		
		function AnimationTypeItemView(model) {
			base.call(this, model, 'animation-type-item');
		}
		
		AnimationTypeItemView.prototype.bindData = function() {
			this.elem.title = this.model.text;
			this.iconElem = this.elem.getElementsByClassName('icon')[0];
			this.iconElem.src = this.model.image;
		};
		
		return AnimationTypeItemView;
	})(ItemView);
	
	var CharacterItemView = (function(base) {
		eve.extend(CharacterItemView, base);
		
		function CharacterItemView(model) {
			base.call(this, model, 'character-item');
		}
		
		CharacterItemView.prototype.bindData = function() {
			this.characterImageElem = this.elem.getElementsByClassName('character-image')[0];
			this.characterImageElem.src= this.model.image;
		};
		
		return CharacterItemView;
	})(ItemView);
	
	var ItemsDialogView = (function(base) {
		eve.extend(ItemsDialogView, base);
		
		function ItemsDialogView(dialogName) {
			base.apply(this, arguments);
			var self = this;
			
			this.dialogWindowElem = document.getElementById(dialogName);
			this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
			this.contentElem = this.dialogWindowElem.getElementsByClassName('content')[0];
			
			this.itemViews = {};
			this.itemViewSelectListener = function(event) {
				var item = event.model;
				self.trigger({
					type: 'select:item',
					item: item
				});
				self.hide();
			};
			this.initializeItemViews();
			
			var crossElementClickListener = function(event) {
				self.hide();
			};
			
			this.crossElem.addEventListener('click', crossElementClickListener);
			
			this.once('dispose', function() {
				self.crossElem.removeEventListener('click', crossElementClickListener);
			});
		}
		
		ItemsDialogView.prototype.show = function(moodValue) {
			base.prototype.show.apply(this, arguments);
			Object.keys(this.itemViews).forEach(function(key) {
				this.itemViews[key].deselect();
			}, this);
			var itemView = this.itemViews[moodValue];
			if (itemView) {
				itemView.select(true);
			}
		};
		ItemsDialogView.prototype.hide = function() {
			base.prototype.hide.apply(this, arguments);
			this.off('select:item');
		};
		
		return ItemsDialogView;
	})(DialogView);
	
	var MoodsDialogView = (function(base) {
		eve.extend(MoodsDialogView, base);
		
		function MoodsDialogView() {
			base.call(this, 'moods-dialog');
		}
		
		MoodsDialogView.prototype.initializeItemViews = function() {
			Object.keys(data.MoodCollection).forEach(function(key) {
				this.addMoodItemView(data.MoodCollection[key]);
			}, this);
		};
		MoodsDialogView.prototype.addMoodItemView = function(mood) {
			var moodItemView = new MoodItemView(mood);
			moodItemView.attachTo(this.contentElem);
			moodItemView.on('select', this.itemViewSelectListener);
			this.itemViews[mood.value] = moodItemView;
		};
		
		return MoodsDialogView;
	})(ItemsDialogView);
	
	var GagsDialogView = (function(base) {
		eve.extend(GagsDialogView, base);
		
		function GagsDialogView() {
			base.call(this, 'gags-dialog');
		}
		
		GagsDialogView.prototype.initializeItemViews = function() {
			Object.keys(data.GagCollection).forEach(function(key) {
				this.addGagItemView(data.GagCollection[key]);
			}, this);
		};
		GagsDialogView.prototype.addGagItemView = function(gag) {
			var gagItemView = new GagItemView(gag);
			gagItemView.attachTo(this.contentElem);
			gagItemView.on('select', this.itemViewSelectListener);
			this.itemViews[gag.value] = gagItemView;
		};
		
		return GagsDialogView;
	})(ItemsDialogView);
	
	var ActionsDialogView = (function(base) {
		eve.extend(ActionsDialogView, base);
		
		function ActionsDialogView() {
			base.call(this, 'actions-dialog');
		}
		
		ActionsDialogView.prototype.initializeItemViews = function() {
			Object.keys(data.ActionCollection).forEach(function(key) {
				this.addActionItemView(data.ActionCollection[key]);
			}, this);
		};
		ActionsDialogView.prototype.addActionItemView = function(action) {
			var actionItemView = new ActionItemView(action);
			actionItemView.attachTo(this.contentElem);
			actionItemView.on('select', this.itemViewSelectListener);
			this.itemViews[action.value] = actionItemView;
		};
		
		return ActionsDialogView;
	})(ItemsDialogView);
	
	var AnimationTypesDialogView = (function(base) {
		eve.extend(AnimationTypesDialogView, base);
		
		function AnimationTypesDialogView() {
			base.call(this, 'animation-types-dialog');
		}
		
		AnimationTypesDialogView.prototype.initializeItemViews = function() {
			Object.keys(data.AnimationTypeCollection).forEach(function(key) {
				this.addAnimationTypeItemView(data.AnimationTypeCollection[key]);
			}, this);
		};
		AnimationTypesDialogView.prototype.addAnimationTypeItemView = function(animationType) {
			var animationTypeItemView = new AnimationTypeItemView(animationType);
			animationTypeItemView.attachTo(this.contentElem);
			animationTypeItemView.on('select', this.itemViewSelectListener);
			this.itemViews[animationType.value] = animationTypeItemView;
		};
		
		return AnimationTypesDialogView;
	})(ItemsDialogView);
	
	var CharactersDialogView = (function(base) {
		eve.extend(CharactersDialogView, base);
		
		function CharactersDialogView() {
			base.call(this, 'characters-dialog');
		}
		
		CharactersDialogView.prototype.initializeItemViews = function() {
			Object.keys(data.CharacterCollection).forEach(function(key) {
				this.addCharacterItemView(data.CharacterCollection[key]);
			}, this);
		};
		CharactersDialogView.prototype.addCharacterItemView = function(character) {
			var characterItemView = new CharacterItemView(character);
			characterItemView.attachTo(this.contentElem);
			characterItemView.on('select', this.itemViewSelectListener);
			this.itemViews[character.value] = characterItemView;
		};
		
		return CharactersDialogView;
	})(ItemsDialogView);
	
	messenger.views.EditPageView = EditPageView;
	
})(messenger, eve, abyss, template, filmlang, data, settings, analytics, Q, async);