window.onload = function() {
	var EventEmitter = eve.EventEmitter;
	var View = abyss.View;
	var Model = abyss.Model;

	var selectElem = document.getElementById('select');
	var editElem = document.getElementById('edit');
	var postElem = document.getElementById('post');

	var selectPageElem = document.getElementById('select-page');
	var editPageElem = document.getElementById('edit-page');
	var postPageElem = document.getElementById('post-page');
	var logoElem = document.getElementById('logo');
	var patternsElem = document.getElementById('patterns');
	var nextElem = document.getElementById('next');

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
	Navigation.prototype.getNextMode = function() {
		if (this.mode === 'select') {
			return 'edit';
		} else if (this.mode === 'edit') {
			return 'post';
		} else if (this.mode === 'post') {
			return 'select';
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

		this.elem.addEventListener('click', elemClickListener, this);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	MessagePatternView.super = View;
	MessagePatternView.prototype = Object.create(View.prototype);
	MessagePatternView.prototype.constructor = MessagePatternView;
	MessagePatternView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
	};
	MessagePatternView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
	};

	var VkontakteUserModel = function() {
		VkontakteUserModel.super.apply(this);
	};
	VkontakteUserModel.super = Model;
	VkontakteUserModel.prototype = Object.create(Model.prototype);
	VkontakteUserModel.prototype.constructor = VkontakteUserModel;

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
	var nextElemClickListener = function(event) {
		navigation.setMode(navigation.getNextMode());
	};

	var messagePatternView1 = new MessagePatternView();
	var messagePatternView2 = new MessagePatternView();
	var messagePatternView3 = new MessagePatternView();
	var messagePatternView4 = new MessagePatternView();
	var messagePatternView5 = new MessagePatternView();
	var messagePatternView6 = new MessagePatternView();
	var messagePatternView7 = new MessagePatternView();
	var messagePatternView8 = new MessagePatternView();

	messagePatternView1.on('select', messagePatternSelectListener);
	messagePatternView2.on('select', messagePatternSelectListener);
	messagePatternView3.on('select', messagePatternSelectListener);
	messagePatternView4.on('select', messagePatternSelectListener);
	messagePatternView5.on('select', messagePatternSelectListener);
	messagePatternView6.on('select', messagePatternSelectListener);
	messagePatternView7.on('select', messagePatternSelectListener);
	messagePatternView8.on('select', messagePatternSelectListener);

	messagePatternView1.attachTo(patternsElem);
	messagePatternView2.attachTo(patternsElem);
	messagePatternView3.attachTo(patternsElem);
	messagePatternView4.attachTo(patternsElem);
	messagePatternView5.attachTo(patternsElem);
	messagePatternView6.attachTo(patternsElem);
	messagePatternView7.attachTo(patternsElem);
	messagePatternView8.attachTo(patternsElem);

	messagePatternView1.select();
	selectedPatternView = messagePatternView1;

	navigation.setMode('select');
	logoElem.addEventListener('click', logoElemClickListener);
	nextElem.addEventListener('click', nextElemClickListener);
	var hash = window.location.hash;
	if (hash) {
		alert(hash);
	}
};


