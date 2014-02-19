window.onload = function() {
	var EventEmitter = eve.EventEmitter;
	var View = abyss.View;

	var selectElem = document.getElementById('select');
	var editElem = document.getElementById('edit');
	var postElem = document.getElementById('post');

	var selectPageElem = document.getElementById('select-page');
	var editPageElem = document.getElementById('edit-page');
	var postPageElem = document.getElementById('post-page');
	var logoElem = document.getElementById('logo');
	var patternsElem = document.getElementById('patterns');

	var Navigation = function() {
		Navigation.super.apply(this);
		this.mode = null;
	};
	Navigation.super = EventEmitter;
	Navigation.prototype = Object.create(EventEmitter.prototype);
	Navigation.prototype.constructor = Navigation;
	Navigation.prototype.setMode = function(mode) {
		if (this.mode !== mode) {
			this.mode = mode;
			this.trigger({
				type: 'mode',
				mode: this.mode
			});
			this.trigger({
				type: ['mode', mode].join(':')
			});
		}
	};

	var MessagePatternView = function() {
		MessagePatternView.super.apply(this);
		var self = this;

		this.elem = template.create('message-pattern-template', { className: 'message-pattern' });
		this.controlsElem = this.elem.getElementsByClassName('controls')[0];
		this.editElem = this.elem.getElementsByClassName('edit')[0];
		this.postElem = this.elem.getElementsByClassName('post')[0];

		this.selected = false;
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.trigger('select');
				self.select();
			}
		};
		var editElemClickListener = function(event) {
			self.trigger('edit');
		};
		var postElemClickListener = function(event) {
			self.trigger('post');
		};

		this.elem.addEventListener('click', elemClickListener, this);
		this.editElem.addEventListener('click', editElemClickListener);
		this.postElem.addEventListener('click', postElemClickListener);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
			self.editElem.removeEventListener('click', editElemClickListener);
			self.postElem.removeEventListener('click', postElemClickListener);
		});
	};
	MessagePatternView.super = View;
	MessagePatternView.prototype = Object.create(View.prototype);
	MessagePatternView.prototype.constructor = MessagePatternView;
	MessagePatternView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
		this.controlsElem.classList.remove('hidden');
	};
	MessagePatternView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.controlsElem.classList.add('hidden');
	};

	var navigation = new Navigation();

	navigation.on('mode:select', function(event) {
		selectElem.classList.remove('normal');
		selectElem.classList.add('chosen');
		selectElem.removeEventListener('click', selectElemClickListener);

		editElem.classList.add('normal');
		editElem.classList.remove('chosen');
		editElem.addEventListener('click', editElemClickListener);

		postElem.classList.add('normal');
		postElem.classList.remove('chosen');
		postElem.addEventListener('click', postElemClickListener);

		selectPageElem.classList.remove('hidden');
		editPageElem.classList.add('hidden');
		postPageElem.classList.add('hidden');
	});

	navigation.on('mode:edit', function(event) {
		selectElem.classList.add('normal');
		selectElem.classList.remove('chosen');
		selectElem.addEventListener('click', selectElemClickListener);

		editElem.classList.remove('normal');
		editElem.classList.add('chosen');
		editElem.removeEventListener('click', editElemClickListener);

		postElem.classList.add('normal');
		postElem.classList.remove('chosen');
		postElem.addEventListener('click', postElemClickListener);

		selectPageElem.classList.add('hidden');
		editPageElem.classList.remove('hidden');
		postPageElem.classList.add('hidden');
	});

	navigation.on('mode:post', function(event) {
		selectElem.classList.add('normal');
		selectElem.classList.remove('chosen');
		selectElem.addEventListener('click', selectElemClickListener);

		editElem.classList.add('normal');
		editElem.classList.remove('chosen');
		editElem.addEventListener('click', editElemClickListener);

		postElem.classList.remove('normal');
		postElem.classList.add('chosen');
		postElem.removeEventListener('click', postElemClickListener);

		selectPageElem.classList.add('hidden');
		editPageElem.classList.add('hidden');
		postPageElem.classList.remove('hidden');
	});

	var logoElemClickListener = function(event) {
		navigation.setMode('select');
	};
	var selectElemClickListener = function(event) {
		navigation.setMode('select');
	};
	var editElemClickListener = function(event) {
		navigation.setMode('edit');
	};
	var postElemClickListener = function(event) {
		navigation.setMode('post');
	};

	var selectedPatternView = null;
	var messagePatternSelectListener = function(event) {
		var target = event.target;
		console.log(target);
		if (target !== selectedPatternView) {
			if (selectedPatternView) {
				selectedPatternView.deselect();
			}
			selectedPatternView = target;
		}
	};
	var messagePatternEditListener = function(event) {
		navigation.setMode('edit');
	};
	var messagePatternPostListener = function() {
		navigation.setMode('post');
	};

	var messagePatternView1 = new MessagePatternView();
	var messagePatternView2 = new MessagePatternView();
	var messagePatternView3 = new MessagePatternView();
	var messagePatternView4 = new MessagePatternView();

	messagePatternView1.on('select', messagePatternSelectListener);
	messagePatternView2.on('select', messagePatternSelectListener);
	messagePatternView3.on('select', messagePatternSelectListener);
	messagePatternView4.on('select', messagePatternSelectListener);

	messagePatternView1.on('edit', messagePatternEditListener);
	messagePatternView2.on('edit', messagePatternEditListener);
	messagePatternView3.on('edit', messagePatternEditListener);
	messagePatternView4.on('edit', messagePatternEditListener);

	messagePatternView1.on('post', messagePatternPostListener);
	messagePatternView2.on('post', messagePatternPostListener);
	messagePatternView3.on('post', messagePatternPostListener);
	messagePatternView4.on('post', messagePatternPostListener);

	messagePatternView1.attachTo(patternsElem);
	messagePatternView2.attachTo(patternsElem);
	messagePatternView3.attachTo(patternsElem);
	messagePatternView4.attachTo(patternsElem);

	messagePatternView1.select();
	selectedPatternView = messagePatternView1;

	navigation.setMode('select');
	logoElem.addEventListener('click', logoElemClickListener);
	var hash = window.location.hash;
	if (hash) {
		alert(hash);
	}
};


