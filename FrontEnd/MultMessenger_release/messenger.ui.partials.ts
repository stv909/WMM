/// <reference path="eye.ts" />
/// <reference path="messenger.ui.ts" />
/// <reference path="messenger.data.ts" />

module messenger {

	export module ui {

		declare var analytics: any;

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
			private dataElem: HTMLElement;
			private cachedElem: HTMLElement;
			private cachedPreviewElem: HTMLElement;
			private cachedFullElem: HTMLElement;

			public constructor(model: data.MessageModel, min?: boolean) {
				super();

				this.model = model;
				this.elem = eye.template({
					templateId: 'message-template',
					className: 'message'
				});
				this.contentElem = <HTMLElement>this.elem.getElementsByClassName('content')[0];
				this.dataElem = <HTMLElement>this.contentElem.getElementsByClassName('data')[0];
				if (min) {
					this.elem.classList.add('min');
				}
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
				this.dataElem.appendChild(this.cachedElem);
			}

			private removeCachedElem(): void {
				if (this.cachedElem) {
					this.dataElem.removeChild(this.cachedElem);
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
			public constructor(model: data.MessageModel, min?: boolean) {
				super(model, min);

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

		export class ContactView extends ControlView {
			public unreadElem: HTMLElement;
			public photoElem: HTMLImageElement;
			public nameElem: HTMLElement;
			public statusElem: HTMLElement;
			public selected: boolean;

			public constructor() {
				super();

				this.elem = eye.template({
					templateId: 'contact-template',
					className: 'contact'
				});
				this.photoElem = <HTMLImageElement>this.elem.getElementsByClassName('photo')[0];
				this.nameElem = <HTMLElement>this.elem.getElementsByClassName('name')[0];
				this.unreadElem = <HTMLElement>this.elem.getElementsByClassName('unread')[0];
				this.statusElem = <HTMLElement>this.elem.getElementsByClassName('status')[0];

				var elemClickListener = () => {
					this.trigger('select-force');
					if (!this.selected) {
						this.select();
					}
				};

				this.elem.addEventListener('click', elemClickListener);
				this.once('dispose', () => {
					this.elem.removeEventListener('click', elemClickListener);
				});
			}

			public select(options?: any): void {
				this.selected = true;
				this.elem.classList.remove('normal');
				this.elem.classList.add('chosen');
				this.trigger({
					type: 'select',
					options: options
				});
			}

			public deselect(): void {
				this.selected = false;
				this.elem.classList.add('normal');
				this.elem.classList.remove('chosen');
				this.trigger('deselect');
			}

			public disableUnreadCounter(): void {
				this.unreadElem.classList.add('super-hidden');
			}

			public disableSelecting(): void {
				this.selected = true;
				this.elem.style.cursor = 'default';
			}

			public disablePhoto(): void {
				this.photoElem.classList.add('hidden');
			}
		}

		export class UserView extends ContactView {
			private isChatUser: boolean;
			private model: data.UserModel;
			private analyticCallback: () => void;

			public constructor(user: data.UserModel, isChatUser?: boolean) {
				super();

				this.isChatUser = isChatUser;
				this.setModel(user);
				this.deselect();
				this.analyticCallback = () => {
					analytics.send('friends', 'friend_select');
				};

				var nameElemClickListener = () => {
					var id = this.model.get('id');
					var vkLink = [ Settings.vkContactBaseUrl, id ].join('');
					window.open(vkLink, '_blank');
				};
				var elemClickListener = () => {
					this.analyticCallback();
				};

				this.nameElem.addEventListener('click', nameElemClickListener);
				this.elem.addEventListener('click', elemClickListener);

				this.once('dispose', () => {
					this.nameElem.removeEventListener('click', nameElemClickListener);
					this.elem.removeEventListener('click', elemClickListener);
				});
			}

			public setModel(user: data.UserModel): void {
				this.model = user;
				if (!this.model) {
					return;
				}

				if (this.isChatUser) {
					var updateUnreadElem = (unread: number) => {
						if (unread > 0) {
							this.unreadElem.textContent = [ '+', unread ].join('');
							this.unreadElem.classList.remove('hidden');
						} else {
							this.unreadElem.classList.add('hidden');
						}
					};
					var updateOnlineStatus = (online: boolean) => {
						if (online) {
							this.statusElem.classList.remove('offline');
						} else {
							this.statusElem.classList.add('offline');
						}
					};
					var updateIsAppUser = (isAppUser: boolean) => {
						if (isAppUser) {
							this.elem.classList.add('app');
						} else {
							this.elem.classList.remove('app');
						}
					};

					this.model.on('set:unread', (e: deep.ModelSetValueEvent<number>) => {
						updateUnreadElem(e.value);
					});
					this.model.on('set:online', (e: deep.ModelSetValueEvent<boolean>) => {
						updateOnlineStatus(e.value);
					});
					this.model.on('set:isAppUser', (e: deep.ModelSetValueEvent<boolean>) => {
						updateIsAppUser(e.value);
					});

					updateUnreadElem(<number>this.model.get('unread'));
					updateOnlineStatus(<boolean>this.model.get('online'));
					updateIsAppUser(<boolean>this.model.get('isAppUser'));
				}

				if (this.model.get('canPost')) {
					this.elem.classList.remove('closed');
				} else {
					this.elem.classList.add('closed');
				}

				this.photoElem.src = this.model.get('photo');
				this.nameElem.textContent = this.model.getFullName();
			}

			public setAnalytic(analyticCallback: () => void): void {
				this.analyticCallback = analyticCallback;
			}
		}

		export class GroupView extends ContactView {
			private model: data.GroupModel;

			public constructor(group: data.GroupModel) {
				super();

				this.setModel(group);
				this.deselect();

				var nameElemClickListener = () => {
					var id = -this.model.get('id');
					var type = this.model.get('type');
					var vkLink = [ Settings.vkGroupBaseUrls[type], id ].join('');
					window.open(vkLink, '_blank');
				};
				var elemClickListener = () => {
					analytics.send('friends', 'group_select');
				};

				this.nameElem.addEventListener('click', nameElemClickListener);
				this.elem.addEventListener('click', elemClickListener);

				this.once('dispose', () => {
					this.nameElem.removeEventListener('click', nameElemClickListener);
					this.elem.removeEventListener('click', elemClickListener);
				});
			}

			public setModel(group: data.GroupModel): void {
				this.model = group;
				if (!this.model) {
					return;
				}

				this.photoElem.src = this.model.get('photo');
				this.nameElem.textContent = this.model.get('name');
			}
		}

	}

}