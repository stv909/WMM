/// <reference path="deep.ts" />
/// <reference path="messenger.data.ts" />

module messenger {

	'use strict';

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

		export class Helper {
			public static buildVkId(contact: data.ContactModel): string {
				var contactId = contact.get('id');
				if (contactId >= 0) {
					return [ 'vkid', contactId ].join('');
				} else {
					var type = contact.get('type');
					return [ 'vk', type, -contactId ].join('');
				}
			}

			public static buildFbId(contact: data.ContactModel): string {
				var contactId = contact.get('id');
				return [ 'fbid', contactId ].join('');
			}

			public static normalizeMessageContent(content: string): string {
				var wkTransformPattern = /(-webkit-transform:([^;]*);)/g;
				var mozTransformPattern = /(-moz-transform:([^;]*);)/g;
				var msTransformPattern = /(-ms-transform:([^;]*);)/g;
				var transformPattern = /([^-]transform:([^;]*);)/g;
				var wkTransformRepeatPattern = /(\s*-webkit-transform:([^;]*);\s*)+/g;

				var buildWkTransform = function(transformValue) {
					return ['-webkit-transform:', transformValue, ';'].join('');
				};
				var buildMozTransform = function(transformValue) {
					return ['-moz-transform:', transformValue, ';'].join('');
				};
				var buildMsTransform = function(transformValue) {
					return ['-ms-transform:', transformValue, ';'].join('');
				};
				var buildTransform = function(transformValue) {
					return ['transform:', transformValue, ';'].join('');
				};
				var replaceTransform = function(match, transform, transformValue) {
					return [
						buildWkTransform(transformValue),
						buildMozTransform(transformValue),
						buildMsTransform(transformValue),
						buildTransform(transformValue)
					].join(' ');
				};
				var replaceWkTransform = function(match, transform, transformValue) {
					return buildWkTransform(transformValue);
				};

				return content
					.replace(mozTransformPattern, replaceWkTransform)
					.replace(msTransformPattern, replaceWkTransform)
					.replace(transformPattern, replaceWkTransform)
					.replace(wkTransformRepeatPattern, replaceTransform)
					.replace(mozTransformPattern, replaceWkTransform)
					.replace(msTransformPattern, replaceWkTransform)
					.replace(transformPattern, replaceWkTransform)
					.replace(wkTransformRepeatPattern, replaceTransform);
			}
		}

	}

}