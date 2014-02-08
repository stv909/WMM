(function(event) {

	'use strict';

	/**
	 * Creates a new EventEmitter instance.
	 * @constructor
	 */
	var EventEmitter = function() {
		this.listeners = {};
	};
	/**
	 * Adds a callback to the EventEmitter object.
	 * @param {string} type An event type to attach a callback.
	 * @param {function} callback A callback function to call on an event.
	 * @param {object=} context An object to use as a context for a callback function.
	 */
	EventEmitter.prototype.on = function(type, callback, context) {
		this.listeners[type] = this.listeners[type] || [];
		this.listeners[type].push({
			callback: callback,
			context: context || this
		});
	};
	/**
	 * Adds a callback that fires once the EventEmitter object.
	 * @param {string} type An event type to attach a callback.
	 * @param {function} callback A callback function to call on an event.
	 * @param {object=} context An object to use as a context for a callback function.
	 */
	EventEmitter.prototype.once = function(type, callback, context) {
		this.listeners[type] = this.listeners[type] || [];
		this.listeners[type].push({
			callback: callback,
			context: context || this,
			once: true
		});
	};
	/**
	 * Removes a callback from the EventEmitter object.
	 * @param {string} type An event type to remove a callback.
	 * @param {function=} callback A callback to remove.
	 * @param {object=} context A context object to determine which callbacks to remove
	 * if many same callback attached.
	 */
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
	/**
	 * Fires a specific event.
	 * @params {object|string} event An event object that contains data for callbacks.
	 * @config {string} event.type An event type to trigger callbacks.
	 * @config {object=} event.target An object triggers an event.
	 */
	EventEmitter.prototype.trigger = function(event) {
		if (typeof event === 'string') {
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

	if (typeof module !== 'undefined') {
		module.exports = event;
	}

})(event || {});