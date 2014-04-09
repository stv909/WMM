var messenger = messenger || {};

(function(messenger, abyss, template, settings, async, Q, html, analytics, filmlang) {
	
	var View = abyss.View;
	
	var MessageEditorView = messenger.views.MessageEditorView;
	var UserView = messenger.views.UserView;

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
	
	messenger.views = messenger.views || {};
	
	messenger.views.AnswerPageView = AnswerPageView;
	messenger.views.SelectPageView = SelectPageView;
	
})(messenger, abyss, template, settings, async, Q, html, analytics, filmlang);