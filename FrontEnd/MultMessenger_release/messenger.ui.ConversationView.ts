/// <reference path="eye.ts" />
/// <reference path="deep.ts" />
/// <reference path="messenger.Settings.ts" />
/// <reference path="messenger.data.ts" />
/// <reference path="messenger.ui.ts" />

module messenger {

	export module ui {

		export class ConversationView extends ControlView {
			private tapePageClickHintListener: () => void;
			private tapePageClickAnswerListener:() => void;
			private tapePageClickWallListener: () => void;

			public constructor() {
				super();
				this.elem = eye.template({
					templateId: 'conversation-template',
					className: 'conversation'
				});
			}
		}

		class TapeItemView extends ControlView {
			private contactView: ControlView;
			private messageView: ControlView;
			private controlsView: MessageControlsView;

			private message: data.ChatMessageModel;
			private contact: data.UserModel;

		}

		export class MessageControlsView extends ControlView {
			private model: data.ChatMessageModel;

			private dateHolderElem: HTMLElement;
			private timeElem: HTMLElement;
			private dateElem: HTMLElement;

			private answerElem: HTMLElement;
			private wallElem: HTMLElement;
			private urlElem: HTMLElement;

			public constructor(message: data.ChatMessageModel) {
				super();

				this.model = message;

				this.elem = eye.template({
					templateId: 'message-controls-template',
					className: 'message-controls'
				});

				this.dateHolderElem = <HTMLElement>this.elem.getElementsByClassName('date-holder')[0];
				this.timeElem = <HTMLElement>this.dateHolderElem.getElementsByClassName('time')[0];
				this.dateElem = <HTMLElement>this.dateHolderElem.getElementsByClassName('date')[0];

				this.answerElem = <HTMLElement>this.elem.getElementsByClassName('answer')[0];
				this.wallElem = <HTMLElement>this.elem.getElementsByClassName('wall')[0];
				this.urlElem = <HTMLElement>this.elem.getElementsByClassName('url')[0];

				var answerElemClickListener = () => {
					this.trigger('click:answer');
				};
				var wallElemClickListener = () => {
					this.trigger('click:wall');
				};
				var urlElemClickListener = () => {
					this.trigger('click:url');
				};

				this.answerElem.addEventListener('click', answerElemClickListener);
				this.wallElem.addEventListener('click', wallElemClickListener);
				this.urlElem.addEventListener('click', urlElemClickListener);

				this.once('dispose', () => {
					this.answerElem.removeEventListener('click', answerElemClickListener);
					this.wallElem.removeEventListener('click', wallElemClickListener);
					this.urlElem.removeEventListener('click', urlElemClickListener);
				});

				var updateTimeElement = () => {
					var setTime = (timeModel: data.TimeModel) => {
						if (timeModel.get('isToday')) {
							this.timeElem.textContent = timeModel.get('time');
							this.timeElem.classList.remove('hidden');
						} else {
							this.dateElem.textContent = timeModel.get('date');
							this.timeElem.textContent = timeModel.get('time');
							this.dateElem.classList.remove('hidden');
							this.dateHolderElem.addEventListener('mouseover', () => {
								this.timeElem.classList.remove('hidden');
							});
							this.dateHolderElem.addEventListener('mouseout', () => {
								this.timeElem.classList.add('hidden');
							});
						}
					};
					var timestamp = <number>this.model.get('timestamp');
					if (timestamp) {
						var timeModel = new data.TimeModel(timestamp);
						setTime(timeModel);
					} else {
						this.timeElem.textContent = 'Отправка...';
						this.model.once('set:timestamp', (e: deep.ModelSetValueEvent<number>) => {
							var timeModel = new data.TimeModel(e.value);
							setTime(timeModel);
						});
					}
				};
				updateTimeElement();
			}

			public hideAnswerButton(): void {
				this.answerElem.classList.add('hidden');
			}
			public hideWallButton(): void {
				this.wallElem.classList.add('hidden');
			}
			public hideUrlButton(): void {
				this.urlElem.classList.add('hidden');
			}
		}

		export class TextMessageView extends ControlView {
			private contentElem: HTMLElement;
			private model: data.ChatMessageModel;

			public constructor(chatMessage: data.ChatMessageModel) {
				super();

				this.model = chatMessage;

				this.elem = eye.template({
					templateId: 'text-message-template',
					className: 'text-message'
				});
				this.contentElem = <HTMLElement>this.elem.getElementsByClassName('content')[0];
				this.contentElem.innerHTML = chatMessage.get('content');
			}
		}

		export class TextUserView extends ControlView {
			private model: data.UserModel;
			private nameElem: HTMLElement;

			public constructor(user: data.UserModel) {
				super();

				this.model = user;

				this.elem = eye.template({
					templateId: 'text-user-template',
					className: 'text-user'
				});
				this.nameElem = <HTMLElement>this.elem.getElementsByClassName('name')[0];
				this.nameElem.textContent = this.model.getFullName();

				var updateOnlineStatus = (online: boolean) => {
					if (online) {
						this.elem.classList.remove('offline');
					} else {
						this.elem.classList.add('online');
					}
				};
				var nameElemClickListener = () => {
					var id = this.model.get('id');
					var vkLink = [ Settings.vkContactBaseUrl, id ].join('');
					window.open(vkLink, '_blank');
				};
				var userSetOnlineListener = (e: deep.ModelSetValueEvent<boolean>) => {
					updateOnlineStatus(e.value);
				};

				this.model.on('set:online', userSetOnlineListener);
				updateOnlineStatus(<boolean>this.model.get('online'));
				this.nameElem.addEventListener('click', nameElemClickListener);

				this.once('dispose', () => {
					this.model.off('set:online', userSetOnlineListener);
					this.nameElem.removeEventListener('click', nameElemClickListener);
				});
			}
		}

	}

}