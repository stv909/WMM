var mvp = mvp || {};

(function(mvp) {
	
	var EventTrigger = function() {
		this.listeners = {};	
	};
	EventTrigger.prototype.addEventListener = function(type, listener) {
		this.listeners[type] = this.listeners[type] || [];
		this.listeners[type].push(listener);
	};
	EventTrigger.prototype.removeEventListener = function(type, listener) {
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
	};
	EventTrigger.prototype.trigger = function(event) {
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
	};
	EventTrigger.prototype.on = EventTrigger.prototype.addEventListener;
	EventTrigger.prototype.off = EventTrigger.prototype.removeEventListener;
	EventTrigger.prototype.fire = EventTrigger.prototype.trigger;
	
	var Model = function() {
		this.attributes = {};
		EventTrigger.call(this);
	};
	Model.prototype = Object.create(EventTrigger.prototype);
	Model.prototype.constructor = Model;
	Model.prototype.setAttribute = function(attribute, value, silent) {
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
	};
	Model.prototype.unsetAttribute = function(attribute, silent) {
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
	};
	Model.prototype.getAttribute = function(attribute) {
		return this.attributes[attribute];
	};
	Model.prototype.toJSON = function() {
		return this.attributes;	
	};
	
	mvp.Model = Model;
	mvp.EventTrigger = EventTrigger;
	
	if (typeof(module) !== typeof(undefined)) {
		module.exports = mvp;
	}
	
})(mvp);