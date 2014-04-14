/// <reference path="messenger.ui.ts" />
/// <reference path="messenger.misc.ts" />

module messenger {

	'use strict';

	export module ui {

		import ErrorCodes = misc.ErrorCodes;
		import MessengerError = misc.MessengerError;

		export class PreloaderView extends ControlView {

			public constructor() {
				super();
				this.elem = document.getElementById('preload-background');
			}

		}

		export class ErrorDialogView extends DialogView {
			private okElem: HTMLElement;
			private statusElem: HTMLElement;

			public constructor() {
				super('error-dialog');

				this.okElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('ok')[0];
				this.statusElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('status')[0];

				var okElemClickListener = () => {
					this.hide();
					this.trigger('click:ok');
				};

				this.okElem.addEventListener('click', okElemClickListener);

				this.once('dispose', () => {
					this.okElem.removeEventListener('click', okElemClickListener);
				});
			}

			public setError(error: MessengerError): void {
				switch (error.errorCode) {
					case ErrorCodes.NO_CONNECTION:
						this.statusElem.textContent = 'Не удалось выполнить операцию.\nПроверьте интернет-подключение и\nпопробуйте позже.';
						break;
					case ErrorCodes.API_ERROR:
						this.statusElem.textContent = 'Ошибка вызова интернет-сервиса.';
						break;
					case ErrorCodes.TIMEOUT:
						this.statusElem.textContent = 'Не удалось выполнить операцию.\nПроверьте интернет-подключение и\nпопробуйте позже.';
						break;
					default:
				}
			}

		}

		export class InviteUserDialogView extends DialogView {
			private okElem: HTMLElement;
			private cancelElem: HTMLElement;

			public constructor() {
				super('invite-user-dialog');

				this.okElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('ok')[0];
				this.cancelElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('cancel')[0];

				var okElemClickListener = () => {
					this.hide();
					this.trigger('click:ok');
				};
				var cancelElemClickListener =() => {
					this.hide();
					this.trigger('click:cancel');
				};

				this.okElem.addEventListener('click', okElemClickListener);
				this.cancelElem.addEventListener('click', cancelElemClickListener);

				this.once('dispose', () => {
					this.okElem.removeEventListener('click', okElemClickListener);
					this.cancelElem.removeEventListener('click', cancelElemClickListener);
				});
			}

		}

		export class SkipDialogView extends DialogView {
			private okElem: HTMLElement;
			private cancelElem: HTMLElement;
			private questionTextElem: HTMLElement;

			public constructor() {
				super('skip-answer-dialog');

				this.okElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('ok')[0];
				this.cancelElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('cancel')[0];
				this.questionTextElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('answer-text')[0];

				var okElemClickListener = () => {
					this.hide();
					this.trigger('click:ok');
				};
				var cancelElemClickListener = () => {
					this.hide();
					this.trigger('click:cancel');
				};

				this.okElem.addEventListener('click', okElemClickListener);
				this.cancelElem.addEventListener('click', cancelElemClickListener);

				this.once('dispose', () => {
					this.okElem.removeEventListener('click', okElemClickListener);
					this.cancelElem.removeEventListener('click', cancelElemClickListener);
				});
			}

			public getText(): string {
				return this.questionTextElem.textContent;
			}

			public setText(text: string): void {
				this.questionTextElem.textContent = text;
			}
		}

		export class CancelMessageUpdateDialogView extends DialogView {
			private okElem: HTMLElement;
			private cancelElem: HTMLElement;

			public constructor() {
				super('ask-message-dialog');

				this.okElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('ok')[0];
				this.cancelElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('cancel')[0];

				var okElemClickListener = () => {
					this.hide();
					this.trigger('click:ok');
				};
				var cancelElemClickListener = () => {
					this.hide();
					this.trigger('click:cancel');
				};

				this.okElem.addEventListener('click', okElemClickListener);
				this.cancelElem.addEventListener('click', cancelElemClickListener);

				this.once('dispose', () => {
					this.okElem.removeEventListener('click', okElemClickListener);
					this.cancelElem.removeEventListener('click', cancelElemClickListener);
				});
			}
		}

		export class CreateTextMessageDialogView extends DialogView {
			private crossElem: HTMLElement;
			private sendElem: HTMLElement;
			private cancelElem: HTMLElement;
			private messageTextElem: HTMLTextAreaElement;

			private documentKeydownListener: (e: KeyboardEvent) => void;

			public constructor() {
				super('create-message-dialog');

				this.crossElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('cross')[0];
				this.sendElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('send')[0];
				this.cancelElem = <HTMLElement>this.dialogWindowElem.getElementsByClassName('cancel')[0];
				this.messageTextElem = <HTMLTextAreaElement>this.dialogWindowElem.getElementsByClassName('message-text')[0];

				this.documentKeydownListener = (e: KeyboardEvent) => {
					if (e.keyCode === 13) {
						sendClickListener();
					}
				};

				var emptyStringPattern = /^\s*$/;
				var cancelClickListener = () => {
					this.hide();
					this.messageTextElem.value = '';
					this.sendElem.classList.add('disabled');
				};
				var sendClickListener = () => {
					var value = this.messageTextElem.value;
					if (!emptyStringPattern.test(value)) {
						this.trigger({
							type: 'click:send',
							text: value.replace(/\r?\n/g, '<br />')
						});
						this.hide();
						this.messageTextElem.value = '';
						this.sendElem.classList.add('disabled');
					}
				};
				var messageTextInputListener = () => {
					if (emptyStringPattern.test(this.messageTextElem.value)) {
						this.sendElem.classList.add('disabled');
					} else {
						this.sendElem.classList.remove('disabled');
					}
				};

				this.crossElem.addEventListener('click', cancelClickListener);
				this.cancelElem.addEventListener('click', cancelClickListener);
				this.sendElem.addEventListener('click', sendClickListener);
				this.messageTextElem.addEventListener('input', messageTextInputListener);

				this.once('dispose', () =>  {
					this.crossElem.addEventListener('click', cancelClickListener);
					this.cancelElem.addEventListener('click', cancelClickListener);
					this.sendElem.addEventListener('click', sendClickListener);
					this.messageTextElem.addEventListener('click', messageTextInputListener);
				});
			}

			public show(): void {
				super.show();
				this.messageTextElem.focus();
				document.addEventListener('keydown', this.documentKeydownListener);
			}

			public hide(): void {
				super.hide();
				document.removeEventListener('keydown', this.documentKeydownListener);
			}
		}

	}

}