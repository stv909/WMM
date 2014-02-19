window.onload = function() {
	var EventEmitter = eve.EventEmitter;

	var selectElem = document.getElementById('select');
	var editElem = document.getElementById('edit');
	var postElem = document.getElementById('post');
	var menuElemCollection = [selectElem, editElem, postElem];

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
	});

	var selectElemClickListener = function(event) {
		navigation.setMode('select');
	};
	var editElemClickListener = function(event) {
		navigation.setMode('edit');
	};
	var postElemClickListener = function(event) {
		navigation.setMode('post');
	};

	navigation.setMode('select');
};


