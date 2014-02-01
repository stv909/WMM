var chat = chat || {};

(function(chat, mvp, template) {
	
	var ContactView = function(model) {
		var self = this;
		mvp.EventTrigger.call(this);

		this.rootElem = null;
		this.model = model;
		this.contactElem = template.create('contact-template', { className: 'contact' });

		this.avatarElem = this.contactElem.getElementsByClassName('avatar')[0];
		this.nameElem = this.contactElem.getElementsByClassName('name')[0];
		this.countElem = this.contactElem.getElementsByClassName('count')[0];
		
		// model listeners
		var modelAvatarListener = function(event) {
			self.avatarElem.src = event.value;	
		};
		var modelNameListener = function(event) {
			var leftBrace = '';
			var rightBrace = '';
			
			switch(self.model.getAttribute('type')) {
				case 'public':
					leftBrace = '[';
					rightBrace = ']';
					break;
				case 'theme':
					leftBrace = '{';
					rightBrace = '}';
					break;
			}
			self.nameElem.textContent = [leftBrace, event.value, rightBrace].join('');
		};
		var modelCountListener = function(event) {
			var count = event.value;
			self.countElem.textContent = ['+', count].join('');
			if (count > 0) {
				self.countElem.classList.remove('hidden');
			} else {
				self.countElem.classList.add('hidden');
			}
		};
		var modelOnlineListener = function(event) {
			var online = event.value;
			if (online) {
				self.contactElem.classList.remove('offline');
			} else {
				self.contactElem.classList.add('offline');
			}
		};
		
		this.model.on('change:avatar', modelAvatarListener);
		this.model.on('change:name', modelNameListener);
		this.model.on('change:count', modelCountListener);
		this.model.on('change:online', modelOnlineListener);
		
		// elems listeners
		var contactElemClickListener = function(event) {
			self.trigger({
				type: 'click',
				model: model	
			});	
		};
		
		this.contactElem.addEventListener('click', contactElemClickListener);
		
		// dispose block
		var disposeListener = function(event) {
			self.off();	
			self.model.off('change:avatar', modelAvatarListener);
			self.model.off('change:name', modelNameListener);
			self.model.off('change:count', modelCountListener);
			self.model.off('change:online', modelOnlineListener);
			self.contactElem.removeEventListener('click', contactElemClickListener);
		};
		
		this.on('dispose', disposeListener);
		
		// init ui
		this.contactElem.title = model.getAttribute('id');
		this.contactElem.classList.add(model.getAttribute('type'));
		modelOnlineListener({ value: model.getAttribute('online') });
		modelNameListener({ value: model.getAttribute('name') });
		modelAvatarListener({ value: model.getAttribute('avatar') });
		modelCountListener({ value: model.getAttribute('count') });
	};
	ContactView.prototype = Object.create(mvp.EventTrigger.prototype);
	ContactView.prototype.constructor = ContactView;
	ContactView.prototype.getModel = function() {
		return this._model;	
	};
	ContactView.prototype.attachTo = function(rootElem) {
		if (!this.rootElem) {
			this.rootElem = rootElem;
			this.rootElem.appendChild(this.contactElem);
		}
	};
	ContactView.prototype.detach = function() {
		if (this.rootElem) {
			this.rootElem.removeChild(this.contactElem);
			this.rootElem = null;
		}
	};
	ContactView.prototype.dispose = function() {
		this.trigger('dispose');
		this.detach();
	};
	
	chat.views = {
		ContactView: ContactView
	};
	
})(chat, mvp, template);