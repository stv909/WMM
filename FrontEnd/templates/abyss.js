var abyss = abyss || {};

(function(abyss, event) {

	'use strict';

	var EventEmitter = event.EventEmitter;

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
	Model.prototype.get = function(attribute) {
		return this.attributes[attribute];
	};
	Model.prototype.has = function(attribute) {
		return (this.attributes).hasOwnProperty(attribute);
	};
	Model.prototype.dispose = function() {
		this.off();
	};

	abyss.Model = Model;

})(abyss, event);