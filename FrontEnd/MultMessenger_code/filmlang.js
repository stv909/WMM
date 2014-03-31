var filmlang = filmlang || {};

(function(filmlang, eve, uuid) {
	
	var FilmTextItem =(function(base) {
		eve.extend(FilmTextItem, base);
		
		function FilmTextItem(value, equalFunc) {
			base.apply(this, arguments);
			this.value = value;
			this.previousValue = value;
			this.isValid = true;
			this.equalFunc = equalFunc;
		}
		
		FilmTextItem.prototype.setValue = function(value) {
			this.equalFunc = this.equalFunc || function(v1, v2) {
				return v1 === v2;	
			};
			if (this.equalFunc(value, this.previousValue)) {
				this.previousValue = value;
				this.value = value;
				this.validate();
			} else {
				this.value = value;
				this.invalidate();
			}
		};
		FilmTextItem.prototype.getValue = function() {
			return this.value;	
		};
		FilmTextItem.prototype.reset = function() {
			this.value = this.previousValue;
			this.validate();
		};
		FilmTextItem.prototype.invalidate = function() {
			this.isValid = false;
			this.trigger({
				type: 'invalidate',
				value: this.value
			});
		};
		FilmTextItem.prototype.validate = function() {
			this.isValid = true;
			this.previousValue = this.value;
			this.trigger({
				type: 'validate',
				value: this.value
			});
		};
		FilmTextItem.prototype.dispose = function() {
			this.trigger('dispose');
			this.off();
		};
		
		return FilmTextItem;
		
	})(eve.EventEmitter);
	
	var FilmText = (function(base) {
		eve.extend(FilmText, base);
		
		function FilmText(meta, actorElem) {
			base.apply(this, arguments);
			var self = this;
			this.actorElem = actorElem;
			
			this.imageItem = null;
			this.typeItem = null;
			
			this.actorItems = [];
			this.commandItems = [];
			
			this.items = [];
			
			this.isValid = true;
			
			this.validateListener = function() {
				var isInvalid = false;
				self.items.forEach(function(item) {
					isInvalid = isInvalid || !item.isValid;	
				});
				self.isValid = !isInvalid;
				if (isInvalid) {
					self.trigger('invalidate');
				} else {
					self.trigger('validate');
				}
			};

			this.initialize(meta);
		}
		
		FilmText.prototype.initialize = function(rawMeta) {
			var meta = JSON.parse(rawMeta);
			
			this._extractType(meta);
			this._extractActors(meta);
			this._extractImage(meta);
			this._extractCommands(meta);
		};
		FilmText.prototype._extractType = function(meta) {
			var type = meta.type;
			this.typeItem = new FilmTextItem(type);
			this.typeItem.on('validate', this.validateListener);
			this.typeItem.on('invalidate', this.validateListener);
			this.items.push(this.typeItem);
		};
		FilmText.prototype._extractActors = function(meta) {
			var actors = meta.actors;
			actors.forEach(function(actor) {
				var actorItem = new FilmTextItem(actor, function(v1, v2) {
					if (!v1 || !v2) {
						return false;
					} else {
						return (v1.value === v2.value && v1.character === v2.character);
					}
				});
				actorItem.on('validate', this.validateListener);
				actorItem.on('invalidate', this.validateListener);
				this.actorItems.push(actorItem);
				this.items.push(actorItem);
			}, this);
		};
		FilmText.prototype._extractImage = function(meta) {
			var url = meta.url;
			this.imageItem = new FilmTextItem(url);
			this.imageItem.on('validate', this.validateListener);
			this.imageItem.on('invalidate', this.validateListener);
			this.items.push(this.imageItem);
		};
		FilmText.prototype._extractCommands = function(meta) {
			var commands = meta.commands;
			commands = ['<root>', commands, '</root>'].join('');
			
			var commandsDom = new DOMParser().parseFromString(commands, 'text/xml');
			var rootElem = commandsDom.getElementsByTagName('root')[0];
			var commandElemCollection = rootElem.childNodes;
			var commandElemArray = Array.prototype.slice.call(commandElemCollection, 0);
			
			commandElemArray.forEach(function(commandElem) {
				var commandItem = new FilmTextItem(commandElem.textContent);
				commandItem.type = commandElem.nodeName;
				commandItem.on('validate', this.validateListener);
				commandItem.on('invalidate', this.validateListener);
				this.commandItems.push(commandItem);
				this.items.push(commandItem);
			}, this);
		};
		FilmText.prototype.reset = function() {
			this.items.forEach(function(item) {
				item.reset();	
			});
		};
		FilmText.prototype.validate = function() {
			this.items.forEach(function(item) {
				item.validate();
			});
		};
		FilmText.prototype.dispose = function() {
			this.items.forEach(function(item) {
				item.dispose();
			});
			this.trigger('dispose');
			this.off();
		};
		FilmText.prototype.toMeta = function() {
			var commands = this.commandItems.reduce(function(previousValue, commandItem) {
				if (commandItem.type !== '#text') {
					var commandChunks =[
						'<', commandItem.type, '>', 
						commandItem.value, 
						'</', commandItem.type, '>'
					];
					return previousValue + commandChunks.join('');
				} else {
					return previousValue + commandItem.value;
				}
			}, '');
			var actors = this.actorItems.map(function(actorItem) {
				return actorItem.value;
			});
			return {
				actors: actors,
				commands: commands,
				type: this.typeItem.value,
				url: this.imageItem.value
			};
		};
		FilmText.prototype.toAnimationRequestData = function() {
			var meta = this.toMeta();
			var commandChunks = [];
			
			commandChunks.push('<?xml version="1.0"?><commands version="1.0.0"><');
			commandChunks.push(meta.type);
			commandChunks.push('>');
			commandChunks.push(meta.commands);
			commandChunks.push('</');
			commandChunks.push(meta.type);
			commandChunks.push('></commands>');

			var data = {
				input: {
					id: uuid.v4(),
					destination: 'separate',
					commands: commandChunks.join(''),
					actors: meta.actors
				}
			};
			var requestData = 'type=build&data=' + encodeURIComponent(JSON.stringify(data));
			
			return requestData;
		};
		
		return FilmText;
	})(eve.EventEmitter);
	
	filmlang.FilmText = FilmText;
	
})(filmlang, eve, uuid);