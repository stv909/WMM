/// <reference path="q.d.ts" />
/// <reference path="eye.ts" />
/// <reference path="deep.ts" />
/// <reference path="messenger.chat.ts" />
/// <reference path="messenger.data.ts" />
/// <reference path="messenger.misc.ts" />

module messenger {

	import Message = chat.Message;
	import MessageFactory = chat.MessageFactory;
	import ContactModel = data.ContactModel;
	import ChatClientWrapper = misc.ChatClientWrapper;
	import Helper = misc.Helper;


	export class MessageSender extends deep.EventEmitter {
		private awaitToken: () => Q.Promise<any>;
		private chatClientWrapper: ChatClientWrapper;

		public constructor(chatClientWrapper: ChatClientWrapper, awaitToken: () => Q.Promise<any>) {
			super();
			this.chatClientWrapper = chatClientWrapper;
			this.awaitToken = awaitToken;
		}

		public send(sender: ContactModel, receiver: ContactModel, content: string, saveOnWall: boolean): void {
			var rawMessage = MessageSender.createRawMessage(sender, receiver, content);
			var messageTarget = Helper.getMessageTarget(sender, receiver);
			var shareMessageUrl = Helper.calculateMessageShareUrl(rawMessage.id);
			console.log(shareMessageUrl);
			this.trigger({
				type: 'send:start',
				modal: saveOnWall
			});

			this.awaitToken().then(() => {
				this.trigger('send:create-message');
				return this.chatClientWrapper.nowAsync();
			}, (): number => {
				this.trigger('send:await-fail');
				throw 'send:await-fail';
				return -1; //compiler needs
			}).then(timestamp => {
				this.trigger('send:save-message');
				rawMessage.timestamp = timestamp;
				return this.chatClientWrapper.sendMessageAsync(rawMessage);
			}).then(() => {
				this.trigger('send:create-preview');
				return vk.getWallUploadServerAsync();
			}).then(uploadUrl => {
				return Helper.generatePreviewAsync(shareMessageUrl, uploadUrl);
			}).then(response => {
				console.log(response);
				var uploadResult = response.uploadResult;
				rawMessage.preview = response.image;
				this.trigger({
					type: 'send:save-preview',
					rawMessage: rawMessage
				});
				this.chatClientWrapper.getChatClient().notifyMessage(rawMessage);
				var isCanPostPromise = receiver.isCanPostAsync();
				var saveWallPhotoPromise = vk.saveWallPhotoAsync(uploadResult);
				return Q.all([ isCanPostPromise, saveWallPhotoPromise ]);
			}).spread((canPost: boolean, response: vk.SaveWallPhotoItem[]) => {
				if (canPost) {
					this.trigger({
						type: 'send:create-post',
						messageTarget: messageTarget,
						receiver: receiver
					});
					var imageId = vk.getUploadedFileId(response);
					var vkPost = Helper.createVkPost(
						rawMessage.id,
						sender.get('id'),
						receiver.get('id'),
						imageId
					);
					if (saveOnWall) {
						return vk.apiAsync('wall.post', vkPost);
					} else {
						return Q.resolve(true);
					}
				} else {
					this.trigger({
						type: 'send:wall-closed',
						messageTarget: messageTarget,
						receiver: receiver
					});
				}
			}).then(() => {
				this.trigger({
					type: 'send:complete',
					messageTarget: messageTarget,
					receiver: receiver
				});
			}).catch((e) => {
				console.log(e);
				this.trigger({
					type: 'send:fail',
					error: e,
					messageTarget: messageTarget,
					receiver: receiver
				});
			}).done();
		}

		public invite(receiver: ContactModel) {
			this.trigger('invite:start');
			receiver.isAppUserAsync().then(isAppUser => {
				if (isAppUser) {
					this.trigger('invite:always');
				} else {
					this.trigger({
						type: 'invite:user',
						user: receiver
					});
				}
			}).catch(() => {
				this.trigger('invite:fail');
			});
		}

		public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
		public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
			super.on(type, callback, context);
		}

		private static createRawMessage(sender: ContactModel, receiver: ContactModel, content: string): Message {
			return MessageFactory.encode({
				id: eye.uuid(),
				content: Helper.normalizeMessageContent(content),
				from: Helper.buildVkId(sender),
				to: Helper.buildVkId(receiver)
			});
		}

	}

}