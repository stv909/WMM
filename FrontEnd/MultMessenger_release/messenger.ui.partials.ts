/// <reference path="eye.ts" />
/// <reference path="messenger.ui.ts" />
/// <reference path="messenger.data.ts" />

module messenger {

	export module ui {

		export interface MessageViewSelectEvent extends deep.Event {
			message: data.MessageModel;
		}

		export interface MessageViewChangeContentEvent extends deep.Event {
			elem: HTMLElement;
		}

		export class MessageView extends ControlView {
			public selected = false;
			private model: data.MessageModel;
			private contentElem: HTMLElement;
			private cachedElem: HTMLElement;
			private cachedPreviewElem: HTMLElement;
			private cachedFullElem: HTMLElement;

			public constructor(model: data.MessageModel) {
				super();

				this.model = model;
				this.elem = eye.template({
					templateId: 'message-template',
					className: 'message'
				});
				this.contentElem = <HTMLElement>this.elem.getElementsByClassName('content')[0];
			}

			public on(type: 'select', callback: (e: MessageViewSelectEvent) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.on(type, callback, context);
			}

			public once(type: 'select', callback: (e: MessageViewSelectEvent) => void, context?: any): void;
			public once<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public once<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.once(type, callback, context);
			}

			public select(): void {
				this.selected = true;
				this.elem.classList.add('chosen');
				this.elem.classList.remove('normal');
				this.removeCachedElem();
				this.addCachedElem(this.getCachedFullElem());
				this.trigger({
					type: 'select',
					message: this.model
				});
			}

			public deselect(): void {
				this.selected = false;
				this.elem.classList.remove('chosen');
				this.elem.classList.add('normal');
				this.removeCachedElem();
				this.addCachedElem(this.cachedPreviewElem);
			}

			public setModel(model: data.MessageModel, full?: boolean): void {
				this.model = model;
				this.removeCachedElem();
				this.prepareCachedPreviewElem();
				if (full) {
					this.prepareCachedFullElem();
				}
				if (this.selected) {
					this.addCachedElem(this.getCachedFullElem());
				} else {
					this.addCachedElem(this.cachedPreviewElem);
				}
			}

			private addCachedElem(cachedElem: HTMLElement): void {
				this.cachedElem = cachedElem;
				this.contentElem.appendChild(this.cachedElem);
			}

			private removeCachedElem(): void {
				if (this.cachedElem) {
					this.contentElem.removeChild(this.cachedElem);
					this.cachedElem = null;
				}
			}

			public prepareCachedPreviewElem(): void {
				this.cachedPreviewElem = document.createElement('div');
				var imgElem = document.createElement('img');
				if (this.model.get('preview')) {
					imgElem.src = this.model.get('preview');
				} else {
					imgElem.src = Settings.emptyPreviewUrl;
					this.model.once('set:preview', (e) => {
						imgElem.src = e.value;
					});
				}
				this.cachedPreviewElem.appendChild(imgElem);
			}

			private prepareCachedFullElem(): void {
				this.cachedFullElem = document.createElement('div');
				this.cachedFullElem.innerHTML = this.model.get('content');
			}

			public getCachedFullElem(): HTMLElement {
				if (!this.cachedFullElem) {
					this.prepareCachedFullElem();
				}
				return this.cachedFullElem;
			}
		}

		export class MessagePatternView extends MessageView {
			public constructor(model: data.MessageModel) {
				super(model);

				this.prepareCachedPreviewElem();
				this.deselect();

				var elemClickListener = () => {
					if (!this.selected) {
						this.select();
						this.trigger('click');
					}
				};

				this.elem.addEventListener('click', elemClickListener);
				this.once('dispose', () => {
					this.elem.removeEventListener('click', elemClickListener);
				});
			}

			public on(type: 'click', callback: (e: deep.Event) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.on(type, callback, context);
			}

			public once(type: 'click', callback: (e: deep.Event) => void, context?: any): void;
			public once<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public once<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.once(type, callback, context);
			}
 		}

		export class MessageEditorView extends MessageView {
			public constructor() {
				super(null);

				this.selected = true;
				this.elem.classList.add('chosen');
				this.elem.classList.remove('normal');
			}

			public setModel(model: data.MessageModel): void {
				super.setModel(model, true);
				this.trigger({
					type: 'change:content',
					elem: this.getCachedFullElem()
				});
			}

			public on(type: 'change:content', callback: (e: MessageViewChangeContentEvent) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public on<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.on(type, callback, context);
			}

			public once(type: 'change:content', callback: (e: MessageViewChangeContentEvent) => void, context?: any): void;
			public once<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void;
			public once<E extends deep.Event>(type: string, callback: (e: E) => void, context?: any): void {
				super.once(type, callback, context);
			}
		}

	}

}