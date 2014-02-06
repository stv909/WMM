var event = event || {};

(function(event) {

	'use strict';

	var EventEmitter = function() {
		this.listeners = {};
	};
	EventEmitter.prototype.on = function(type, callback, context) {
		this.listeners[type] = this.listeners[type] || [];
		this.listeners[type].push({
			callback: callback,
			context: context || this
		});
	};
	EventEmitter.prototype.once = function(type, callback, context) {
		this.listeners[type] = this.listeners[type] || [];
		this.listeners[type].push({
			callback: callback,
			context: context || this,
			once: true
		});
	};
	EventEmitter.prototype.off = function(type, callback, context) {
		if (!type) {
			this.listeners = {};
		} else if (this.listeners[type] instanceof Array) {
			if (callback) {
				this.listeners[type] = this.listeners[type].filter(function(listener) {
					var sameCallbacks = listener.callback === callback;
					var sameContexts = context ? listener.context === context : true;
					return !(sameCallbacks && sameContexts);
				});
			} else {
				this.listeners[type] = [];
			}
		}
	};
	EventEmitter.prototype.trigger = function(event) {
		if (typeof(event) === 'string') {
			event = { type: event };
		}
		if (!event.target) {
			event.target = this;
		}
		if (this.listeners[event.type] instanceof Array) {
			var hasExpiredListeners = false;
			this.listeners[event.type].forEach(function(listener) {
				listener.callback.call(listener.context, event);
				hasExpiredListeners = listener.once || hasExpiredListeners;
			});
			if (hasExpiredListeners) {
				this.listeners[event.type] = this.listeners[event.type].filter(function(listener) {
					return !listener.once;
				});
			}
		}
	};

	event.EventEmitter = EventEmitter;

	if (module) {
		module.exports = event;
	}

})(event);