var abyss = abyss || {};

(function(abyss, eve) {

	'use strict';

	var EventEmitter = eve.EventEmitter;

	var Model = function() {
		Model.super.apply(this);

		this.attributes = {};
	};
	Model.super = EventEmitter;
	Model.prototype = Object.create(EventEmitter.prototype);
	Model.prototype.constructor = Model;
	Model.prototype.set = function(attribute, value, options) {
		var attributes;
		if (typeof attribute === 'object') {
			attributes = attribute;
			options = value;
		} else {
			attributes = {};
			attributes[attribute] = value;
		}

		options || (options = {});
		var target = options.target || this;
		var silent = options.silent;

		Object.keys(attributes).forEach(function(key) {
			this.attributes[key] = attributes[key];
			if (!silent) {
				this.trigger({
					type: 'change:' + key,
					target: target,
					value: attributes[key]
				});
			}
		}, this);

		if (!silent) {
			this.trigger({
				type: 'change',
				target: target,
				attributes: attributes
			});
		}
	};
	Model.prototype.unset = function(attribute, options) {
		options || (options = {});
		var silent = options.silent;
		delete this.attributes[attribute];
		if (!silent) {
			this.trigger({
				type: 'remove',
				attribute: attribute
			});
			this.trigger({
				type: 'remove:' + attribute
			});
		}
	};
	Model.prototype.get = function(attribute) {
		return this.attributes[attribute];
	};
	Model.prototype.has = function(attribute) {
		return (this.attributes).hasOwnProperty(attribute);
	};
	Model.prototype.toJSON = function() {
		return this.attributes;
	}
	Model.prototype.dispose = function() {
		this.off();
	};

	var View = function() {
		View.super.apply(this);

		this.model = null;
		this.parentElem = null;
		this.elem = null;
	};
	View.super = EventEmitter;
	View.prototype = Object.create(EventEmitter.prototype);
	View.prototype.constructor = View;
	View.prototype.attachTo = function(parentElem) {
		if (!this.parentElem) {
			this.parentElem = parentElem;
			this.parentElem.appendChild(this.elem);
		}
	};
	View.prototype.attachFirstTo = function(parentElem) {
		if (!this.parentElem) {
			this.parentElem = parentElem;
			this.parentElem.insertBefore(this.elem, this.parentElem.childNodes[0]);
		}
	};
	View.prototype.detach = function() {
		if (this.parentElem) {
			this.parentElem.removeChild(this.elem);
			this.parentElem = null;
		}
	};
	View.prototype.dispose = function() {
		this.trigger('dispose');
		this.detach();
		this.off();
	};

	abyss.Model = Model;
	abyss.View = View;

})(abyss, eve);