/// <reference path="q.d.ts" />
/// <reference path="eye.ts" />
/// <reference path="deep.ts" />
/// <reference path="messenger.data.ts" />
/// <reference path="messenger.Settings.ts" />
/// <reference path="messenger.chat.ts" />

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

		export enum MessageTargets {
			Self, Friend, Group
		}

		export interface PreviewResponse {
			uploadResult: {
				image: string;
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

			public static getMessageTarget(sender: data.ContactModel, receiver: data.ContactModel): MessageTargets {
				var senderId = sender.get('id');
				var receiverId = receiver.get('id');
				if (senderId === receiverId) {
					return MessageTargets.Self;
				} else if (receiverId < 0) {
					return MessageTargets.Group;
				} else {
					return MessageTargets.Friend;
				}
			}

			public static calculateMessageShareUrl(messageId: string): string {
				return [ Settings.shareMessageBaseUrl, messageId ].join('');
			}

			public static generatePreviewAsync(messageShareUrl: string, uploadUrl?: string): Q.Promise<PreviewResponse> {
				var requestData = {
					uploadUrl: uploadUrl,
					url: messageShareUrl,
					imageFormat: 'png',
					scale: 1,
					contentType: uploadUrl ? 'vkUpload' : 'share'
				};
				var rawRequestData = JSON.stringify(requestData);
				var options = {
					url: Settings.previewGeneratorUrl,
					method: 'POST',
					data: 'type=render&data=' + encodeURIComponent(rawRequestData)
				};
				return eye.requestAsync(options).then(rawData => {
					return <PreviewResponse>JSON.parse(rawData);
				});
			}

			public static createVkPost(messageId: string, senderId: number, receiverId: number, imageId: string) {
				var content = null;
				var appUrl = Settings.vkAppUrl;
				var hash = ['senderId=', senderId, '&messageId=', messageId].join('');
				var answerUrl = [appUrl, '#', hash].join('');
				var fullAnswerUrl = ['https://', answerUrl].join('');

				if (senderId === receiverId) {
					content = 'Мой мульт!\nСмотреть: ';
				} else if (receiverId < 0) {
					content = 'Зацените мульт!\nСмотреть: ';
				} else {
					content = 'Тебе мульт!\nСмотреть: ';
				}

				return {
					owner_id: senderId,
					message: [content, answerUrl].join(''),
					attachments: [imageId, fullAnswerUrl].join(','),
					v: 5.12
				};
			}
		}

		export class ChatClientWrapper {
			private chatClient: chat.ChatClient;
			private operationTimeout = 600000;

			public constructor(chatClient: chat.ChatClient) {
				this.chatClient = chatClient;
			}

			public getChatClient(): chat.ChatClient {
				return this.chatClient;
			}

			private createRequestTask<T>(checkReadyState?: boolean, operationTimeout?: number): Q.Deferred<T> {
				var task = Q.defer<T>();
				if (checkReadyState && this.chatClient.readyState() !== 1) {
					task.reject({
						errorCode: ErrorCodes.NO_CONNECTION
					})
				} else {
					setTimeout(() => {
						task.reject({
							errorCode: ErrorCodes.TIMEOUT
						})
					}, operationTimeout || this.operationTimeout);
				}
				return task;
			}

			public connectAsync(): Q.Promise<any> {
				var task = this.createRequestTask();

				this.chatClient.once('connect', (e) => {
					task.resolve(null);
				});
				this.chatClient.connect();

				return task.promise;
			}

			public loginAsync(account: string): Q.Promise<any> {
				var task = this.createRequestTask();

				this.chatClient.once('message:login', (e: any) => {
					task.resolve(null);
				});
				this.chatClient.login(account);

				return task.promise;
			}

			public connectAndLoginAsync(account: string): Q.Promise<any> {
				var self = this;
				return this.connectAsync().then(function() {
					return self.loginAsync(account);
				});
			}

			public getMessageIdsAsync(groupId: string, count: number, offset: number): Q.Promise<any> {
				var task = this.createRequestTask(true);

				this.chatClient.once('message:grouptape', (e: any) => {
					var grouptape = e.response.grouptape;
					if (grouptape.success) {
						task.resolve({
							messagecount: grouptape.messagecount,
							data: grouptape.data
						});
					} else {
						task.resolve({
							messagecount: 0,
							data: []
						});
					}
				});
				this.chatClient.grouptape(groupId, count, offset);

				return task.promise;
			}

			public getMessagesAsync(messageIds: string[]): Q.Promise<any> {
				var task = this.createRequestTask(true);

				this.chatClient.once('message:retrieve', (e: any) => {
					var rawMessages = e.response.retrieve;
					task.resolve(rawMessages);
				});
				this.chatClient.retrieve(messageIds.join(','));

				return task.promise;
			}

			public getProfileAsync(profileId: string): Q.Promise<any> {
				var task = this.createRequestTask(true);

				this.chatClient.once('message:retrieve', (e: any) => {
					var profile = e.response.retrieve[0];
					task.resolve(profile);
				});
				this.chatClient.retrieve(profileId);

				return task.promise;
			}

			public saveProfileAsync(profileId: string, data: string): Q.Promise<any> {
				this.chatClient.store(null, profileId, data);
				return Q.resolve(true);
			}

			public nowAsync(timeout?: number): Q.Promise<number> {
				var task = this.createRequestTask<number>(true, timeout);

				this.chatClient.once('message:now', (e: any) => {
					var timestamp = e.response.now;
					task.resolve(<number>timestamp);
				});
				this.chatClient.now();

				return task.promise;
			}

			public sendMessageAsync(message: chat.Message): Q.Promise<any> {
				var task = this.createRequestTask(true);

				this.chatClient.once('message:send', (e: any) => {
					var rawMessage = e.response.send;
					task.resolve(rawMessage);
				});
				this.chatClient.once('message:sent',(e: any) => {
					var rawMessage = e.response.sent;
					task.resolve(rawMessage);
				});
				this.chatClient.sendMessage(message);

				return task.promise;
			}

			public loadTapeAsync(): Q.Promise<any> {
				var task = this.createRequestTask(true);

				this.chatClient.once('message:tape', (e: any) => {
					var tape = e.response.tape;
					task.resolve(tape);
				});
				this.chatClient.tape();

				return task.promise;
			}
		}

	}

}