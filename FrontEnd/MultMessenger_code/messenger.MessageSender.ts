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

		public send(sender: ContactModel, receiver: ContactModel, content: string): void {
			var rawMessage = MessageSender.createRawMessage(sender, receiver, content);
			var messageTarget = Helper.getMessageTarget(sender, receiver);
			var shareMessageUrl = Helper.calculateMessageShareUrl(rawMessage.id);

			this.trigger('send:start');

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
				var uploadResult = response.uploadResult;
				rawMessage.preview = uploadResult.image;
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
					this.trigger('send:create-post');
					var imageId = vk.getUploadedFileId(response);
					var vkPost = Helper.createVkPost(
						rawMessage.id,
						sender.get('id'),
						receiver.get('id'),
						imageId
					);
					return vk.apiAsync('wall.post', vkPost);
				} else {
					this.trigger('send:wall-closed');
				}
			}).then(() => {
				this.trigger({
					type: 'send-complete',
					messageTarget: messageTarget
				});
			}).catch((e) => {
				this.trigger({
					type: 'send:fail',
					error: e,
					messageTarget: messageTarget
				});
			}).done();
		}

		public invite(receiver: ContactModel) {
			this.trigger('invite:start');
			receiver.isAppUserAsync().then(isAppUser => {
				if (isAppUser) {
					this.trigger('invite:user');
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