var messenger = messenger || {};

(function(messenger, abyss, template, errors) {
	
	var View = abyss.View;
	var ErrorCodes = errors.ErrorCodes;
	var CharacterItemView = messenger.views.CharacterItemView;
	
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
		this.elem.classList.add('hidden');
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
				this.readyElem.classList.remove('hidden');
				this.hide();
				break;
			case 'fail':
				this.dialogWindowElem.classList.add('error');
				this.statusElem.textContent = 'Ошибка обновления!\n Проверьте интернет-подключение и \nпопробуйте позже.';
				this.readyElem.classList.remove('hidden');
				break;
		}
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
	PostDialogView.prototype.setMode = function(mode, error) {
		switch (mode) {
			case 'wait':
				this.statusElem.textContent = 'Этап 1 из 5: Создание сообщения...';
				this.readyElem.classList.add('hidden');
				this.dialogWindowElem.classList.remove('error');
				this.complete = false;
				break;
			case 'complete':
				this.statusElem.textContent = 'Сообщение отправлено!';
				this.readyElem.classList.remove('hidden');
				this.dialogWindowElem.classList.remove('error');
				this.complete = true;
				break;
			case 'fail':
				this.statusElem.textContent = 'Сообщение не отправлено!';
				this.dialogWindowElem.classList.add('error');
				this.readyElem.classList.remove('hidden');
				this.setError(error);
				this.complete = false;
		}
	};
	PostDialogView.prototype.setError = function(error) {
		if (error.errorCode === ErrorCodes.RESTRICTED) {
			this.statusElem.textContent = 'Невозможно отправить сообщение.\nПользователь закрыл доступ к стене.';
		} else if (error.errorCode === ErrorCodes.NO_CONNECTION || error.errorCode === ErrorCodes.TIMEOUT) {
			this.statusElem.textContent = 'Не удалось отправить сообщение!\nПроверьте интернет-подключение и \nпопробуйте позже.';
		}
	};
	
	var CharactersDialogView = function() {
		CharactersDialogView.super.apply(this);
		var self = this;
		
		this.elem = document.getElementById('dialog-background');
		this.dialogWindowElem = document.getElementById('characters-dialog');
		this.crossElem = this.dialogWindowElem.getElementsByClassName('cross')[0];
		this.contentElem = this.dialogWindowElem.getElementsByClassName('content')[0];
		
		this.characterItemViews = {};
		
		this.characterItemViewClickListener = function(event) {
			var character = event.character;
			self.trigger({
				type: 'select:character',
				character: character
			});
			self.hide();
		};
		
		var crossElemClickListener = function(event) {
			self.hide();
		};
		
		this.crossElem.addEventListener('click', crossElemClickListener);
		
		this.once('dispose', function(event) {
			self.crossElem.removeEventListener('click', crossElemClickListener);
		});
	};
	CharactersDialogView.super = View;
	CharactersDialogView.prototype = Object.create(View.prototype);
	CharactersDialogView.prototype.constructor = CharactersDialogView;
	CharactersDialogView.prototype.show = function(characterId) {
		var self = this;
		Object.keys(this.characterItemViews).forEach(function(key) {
			self.characterItemViews[key].deselect();
		});
		this.characterItemViews[characterId].select(true);
		this.elem.classList.remove('hidden');
		this.dialogWindowElem.classList.remove('hidden');
	};
	CharactersDialogView.prototype.hide = function() {
		this.elem.classList.add('hidden');
		this.dialogWindowElem.classList.add('hidden');
		this.off('select:character');
	};
	CharactersDialogView.prototype.addCharacterItem = function(characterItem) {
		var characterItemView = new CharacterItemView(characterItem);
		characterItemView.attachTo(this.contentElem);
		characterItemView.on('select:character', this.characterItemViewClickListener);
		this.characterItemViews[characterItem.key] = characterItemView;
	};
	
	messenger.views = messenger.views || {};
	
	messenger.views.PreloadDialogView = PreloadDialogView;
	messenger.views.ErrorDialogView = ErrorDialogView;
	messenger.views.AskMessageDialogView = AskMessageDialogView;
	messenger.views.SkipDialogView = SkipDialogView;
	messenger.views.UpdateMessageDialogView = UpdateMessageDialogView;
	messenger.views.PostDialogView = PostDialogView;
	messenger.views.CharactersDialogView = CharactersDialogView;
	
})(messenger, abyss, template, errors);