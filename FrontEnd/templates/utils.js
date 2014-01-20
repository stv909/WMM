var utils = utils || {};

(function(utils) {
	
	var Event = function() {
		this.listeners = {};
	};
	
	Event.prototype.on = function(type, listener) {
		this.listeners[type] = this.listeners[type] || [];
		this.listeners[type].push(listener);
	};
	Event.prototype.off = function(type, listener) {
		if (this.listeners[type] instanceof Array) {
			var currentListeners = this.currentListeners[type];
			var index = currentListeners.indexOf(listener);
			if (index !== -1) {
				currentListeners.splice(index, 1);
			}
		}
	};
	Event.prototype.trigger = function(event) {
		if (typeof event === 'string') {
			event = {
				type: event
			};
		}
		if (!event.target) {
			event.target = this;
		}
		if (this.listeners[event.type] instanceof Array) {
			var currentListeners = this.listeners[event.type];
			for (var i = 0; i < currentListeners.length; i++) {
				currentListeners[i].call(this, event);
			}
		}
	};
	
	utils.Event = Event;
	
	if (typeof(module) !== typeof(undefined)) {
		module.exports = utils;
	}
	
})(utils);
