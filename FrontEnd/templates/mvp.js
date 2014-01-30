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
		Model.super.constructor.apply(this);
		
		this.attributes = {};
	};
	Model.super = EventTrigger.prototype;
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
	Model.prototype.dispose = function() {
		this.trigger('dispose');
		this.off();
	};
	Model.prototype.toJSON = function() {
		return this.attributes;	
	};
	
	var View = function() {
		View.super.constructor.apply(this);
		
		this.model = null;
		this.parentElem = null;
		this.elem = null;
	};
	View.super = EventTrigger.prototype;
	View.prototype = Object.create(EventTrigger.prototype);
	View.prototype.constructor = View;
	View.prototype.getModel = function() {
		return this.model;	
	};
	View.prototype.attachTo = function(parentElem) {
		if (!this.parentElem) {
			this.parentElem = parentElem;
			this.parentElem.appendChild(this.elem);
		}
	};
	View.prototype.dettach = function() {
		if (this.parentElem) {
			this.parentElem.removeChild(this.elem);
			this.parentElem = null;	
		}	
	};
	View.prototype.dispose = function() {
		this.detach();
		this.off();
	};
	
	mvp.EventTrigger = EventTrigger;
	mvp.Model = Model;
	mvp.View = View;
	
	if (typeof(module) !== typeof(undefined)) {
		module.exports = mvp;
	}
	
})(mvp);