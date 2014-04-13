/// <reference path="deep.ts" />

module messenger {

	export module misc {

		export enum ErrorCodes {
			NO_CONNECTION = 1,
			API_ERROR = 2,
			TIMEOUT = 4,
			RESTRICTED = 8
		}

		export interface MessengerError {
			errorCode: ErrorCodes;
			message: any;
		}

		export interface DelayedObserverChangeEvent<T> extends deep.Event {
			value: T;
		}

		export class DelayedObserver<T> extends deep.EventEmitter {
			private value: T;
			private delay: number;
			private timeoutHandler: number;

			public constructor(value: T, delay?: number) {
				super();

				this.value = value;
				this.delay = delay || 800;
			}

			public getDelay(): number {
				return this.delay;
			}
			public setDelay(delay: number): void {
				this.delay = delay;
			}

			public setValue(value: T) {
				if (this.timeoutHandler) {
					clearTimeout(this.timeoutHandler);
					this.timeoutHandler = null;
				}
				if (value !== this.value) {
					this.timeoutHandler = setTimeout(() => {
						this.value = value;
						this.trigger({
							type: 'change:value',
							value: this.value
						});
					}, this.delay);
				}
			}

			public on(type: 'change:value', callback: (e: DelayedObserverChangeEvent<T>) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.on(type, callback, context);
			}
		}

	}

}