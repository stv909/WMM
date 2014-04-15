/// <reference path="deep.ts" />

module messenger {

	'use strict';

	export module ui {

		export class ControlView extends deep.View {
			public show(): void {
				this.elem.classList.remove('hidden');
			}

			public hide(): void {
				this.elem.classList.add('hidden');
			}
		}

		export class DialogView extends deep.View {
			public dialogWindowElem: HTMLElement;

			public constructor(dialogElementId: string) {
				super();

				this.elem = document.getElementById('dialog-background');
				this.dialogWindowElem = document.getElementById(dialogElementId);
			}

			public show(): void {
				this.elem.classList.remove('hidden');
				this.showDialogWindowElem();
			}

			public hide(): void {
				this.elem.classList.add('hidden');
				this.hideDialogWindowElem();
			}

			public showDialogWindowElem(): void {
				this.dialogWindowElem.classList.remove('hidden');
			}

			public hideDialogWindowElem(): void {
				this.dialogWindowElem.classList.add('hidden');
			}
		}

	}

}