var mvp = mvp || {};

(function(mvp) {

	var inherit = function(child, parent) {
		child.super = parent.prototype;
		child.prototype = Object.create(parent.prototype);
		child.prototype.constructor = child;
	};
	var extend = function(target, props) {
		Object.keys(props).forEach(function(key) {
			target[key] = props[key];
		});
	};

	var EventTrigger = function() {
		this.listeners = {};	
	};
	extend(EventTrigger.prototype, {
		on: function(type, listener) {
			this.listeners[type] = this.listeners[type] || [];
			this.listeners[type].push(listener);
		},
		off: function(type, listener) {
			if (!type) {
				this.listeners = {};
			}
			else if (this.listeners[type] instanceof Array) {
				if (listener) {
					var index = this.listeners[type].indexOf(listener);
					if (index !== -1) {
						this.listeners[type].splice(index, 1);
					}
				} else {
					this.listeners[type] = [];
				}
			}
		},
		trigger: function(event) {
			if (typeof(event) === typeof('')) {
				event = { type: event };
			}
			if (!event.target) {
				event.target = this;
			}
			if (this.listeners[event.type] instanceof Array) {
				var self = this;
				var typeListeners = this.listeners[event.type];
				typeListeners.forEach(function(listener) {
					listener.call(self, event);
				});
			}
		}
	});

	var Model = function() {
		Model.super.constructor.apply(this);
		
		this.attributes = {};
	};
	inherit(Model, EventTrigger);
	extend(Model.prototype, {
		setAttribute: function(attribute, value, silent) {
			this.attributes[attribute] = value;
			if (!silent) {
				this.trigger({
					type: 'change',
					attribute: attribute,
					value: value
				});
				this.trigger({
					type: ['change', attribute].join(':'),
					value: value
				});
			}
		},
		unsetAttribute: function(attribute, silent) {
			delete this.attributes[attribute];
			if (!silent) {
				this.trigger({
					type: 'remove',
					attribute: attribute
				});
				this.trigger({
					type: ['remove', attribute].join(':')
				});
			}
		},
		getAttribute: function(attribute) {
			return this.attributes[attribute];
		},
		dispose: function() {
			this.trigger('dispose');
			this.off();
		},
		toJSON: function() {
			return this.attributes;
		}
	});

	var View = function() {
		View.super.constructor.apply(this);

		this.model = null;
		this.parentElem = null;
		this.elem = null;
	};
	inherit(View, EventTrigger);
	extend(View.prototype, {
		getModel: function() {
			return this.model;
		},
		attachTo: function(parentElem) {
			if (!this.parentElem) {
				this.parentElem = parentElem;
				this.parentElem.appendChild(this.elem);
			}
		},
		detach: function() {
			if (this.parentElem) {
				this.parentElem.removeChild(this.elem);
				this.parentElem = null;
			}
		},
		dispose: function() {
			this.trigger('dispose');
			this.detach();
			this.off();
		}
	});

	mvp.EventTrigger = EventTrigger;
	mvp.Model = Model;
	mvp.View = View;
	mvp.extend = extend;
	mvp.inherit = inherit;

	if (typeof(module) !== typeof(undefined)) {
		module.exports = mvp;
	}

})(mvp);