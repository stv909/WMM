module deep {

	'use strict';

	export interface Event {
		type: string;
		target?: any;
	}

	export interface EventListener {
		callback: (e: Event) => void;
		context: any;
		once?: boolean;
	}

	export class EventEmitter {
		private listeners: { [ type: string ]: EventListener[] } = {};

		public on(type: string, callback: (e: Event) => void, context?: any): void {
			this.listeners[type] = this.listeners[type] || [];
			this.listeners[type].push({
				callback: callback,
				context: context || this
			});
		}

		public once(type: string, callback: (e: Event) => void, context?: any): void {
			this.listeners[type] = this.listeners[type] || [];
			this.listeners[type].push({
				callback: callback,
				context: context || this,
				once: true
			});
		}

		public off(): void;
		public off(type: string): void;
		public off(type: string, callback: (e: Event) => void): void;
		public off(type: string, callback: (e: Event) => void, context: any): void;
		public off(type?: string, callback?: (e: Event) => void, context?: any): void {
			if (!type) {
				this.listeners = {};
			} else if (!!this.listeners[type]) {
				if (callback) {
					this.listeners[type] = this.listeners[type].filter((listener: EventListener) => {
						var sameCallbacks = listener.callback === callback;
						var sameContexts = context ? listener.context === context : true;
						return !(sameCallbacks && sameContexts);
					});
				} else {
					this.listeners[type] = [];
				}
			}
		}

		public trigger(event: string): void;
		public trigger(event: Event): void;
		public trigger(event: any): void {
			if (typeof event === 'string') {
				event = { type: event };
			}
			if (!event.target) {
				event.target = this;
			}
			if (this.listeners[event.type]) {
				var hasExpiredListeners = false;
				this.listeners[event.type].forEach((listener: EventListener) => {
					listener.callback.call(listener.context, event);
					hasExpiredListeners = listener.once || hasExpiredListeners;
				});
				if (hasExpiredListeners) {
					this.listeners[event.type] = this.listeners[event.type].filter((listener: EventListener) => {
						return !listener.once;
					});
				}
			}
		}
	}

	export interface CallOptions {
		silent?: boolean;
		target?: any;
	}

	export interface ModelSetEvent extends Event {
		target: any;
		attributes: {};
	}

	export interface ModelUnsetEvent extends Event {
		target: any;
		key: string;
	}

	export class Model extends EventEmitter {
		private attributes = {};
		private disposed = false;

		public constructor() {
			super();
		}

		public set(key: string, value: any, options?: CallOptions): void;
		public set(attributes: { [ key: string ]: any }, options?: CallOptions): void;
		public set(): void {
			var attributes: { [ key: string ]: any };
			var options: CallOptions;

			if (typeof(arguments[0]) === 'object') {
				attributes = arguments[0];
				options = arguments[1];
			} else {
				attributes = {};
				attributes[arguments[0]] = arguments[1];
				options = arguments[2];
			}

			options || (options = {});
			var target = options.target || this;
			var silent = options.silent;

			Object.keys(attributes).forEach(key => {
				this.attributes[key] = attributes[key];
				if (!silent) {
					this.trigger({
						type: 'set:' + key,
						target: target,
						value: attributes[key]
					});
				}
			});

			if (!silent) {
				this.trigger({
					type: 'set',
					target: target,
					attributes: attributes
				});
			}
		}

		public unset(key: string, options?: CallOptions) {
			options || (options = {});
			var target = options.target || this;
			var silent = options.silent;

			if (this.has(key)) {
				delete this.attributes[key];
				if (!silent) {
					this.trigger({
						type: 'unset',
						target: target,
						key: key
					});
					this.trigger({
						type: 'unset:' + key,
						target: target
					});
				}
			}
		}

		public get(key: string): any {
			return this.attributes[key];
		}

		public has(key: string): boolean {
			return this.attributes.hasOwnProperty(key);
		}

		public on(type: 'set', callback: (e: ModelSetEvent) => void, context?: any): void;
		public on(type: 'unset', callback: (e: ModelUnsetEvent) => void, context?: any): void;
		public on(type: string, callback: (e: Event) => void, context?: any): void;
		public on(type: string, callback: (e: Event) => void, context?: any): void {
			super.on(type, callback, context);
		}

		public toJSON(): {} {
			return this.attributes;
		}

		public dispose(): void {
			if (!this.disposed) {
				this.disposed = true;
				this.trigger('dispose');
				this.off();
			}
		}
	}

	export class View extends EventEmitter {
		public elem: HTMLElement;
		public parentElem: HTMLElement;
		private disposed = false;

		public constructor() {
			super();
		}

		public getRootElem(): HTMLElement {
			return this.elem;
		}

		public getParentElem(): HTMLElement {
			return this.parentElem;
		}

		public attachTo(parentElem: HTMLElement): void {
			if (!this.parentElem) {
				this.parentElem = parentElem;
				this.parentElem.appendChild(this.elem);
			}
		}

		public attachFirstTo(parentElem: HTMLElement): void {
			if (!this.parentElem) {
				this.parentElem = parentElem;
				this.parentElem.insertBefore(this.elem, this.parentElem.childNodes[0]);
			}
		}

		public detach(): void {
			if (this.parentElem) {
				this.parentElem.removeChild(this.elem);
				this.parentElem = null;
			}
		}

		public dispose() {
			if (!this.disposed) {
				this.disposed = true;
				this.trigger('dispose');
				this.detach();
				this.off();
			}
		}
	}

}