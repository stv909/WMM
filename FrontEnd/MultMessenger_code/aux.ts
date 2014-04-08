/// <reference path="q.d.ts" />
module aux {

	interface HTMLTemplateElement extends HTMLElement{
		content: DocumentFragment;
	}

	function initializeTemplates(): void {
		function checkContentAvailable(): boolean {
			return 'content' in document.createElement('template');
		}
		function loadEventListener(): void {
			window.removeEventListener('load', loadEventListener);

			if (!checkContentAvailable()) {
				var templateElementCollection = document.getElementsByTagName('template');

				for (var i = 0; i < templateElementCollection.length; i++) {
					var templateElem = <HTMLTemplateElement>templateElementCollection[i];
					var childNodes = templateElem.childNodes;
					var content = document.createDocumentFragment();

					while (childNodes[0]) {
						content.appendChild(childNodes[0]);
					}

					templateElem.content = content;
				}
			}
		}
		window.addEventListener('load', loadEventListener);
	}

	export interface TemplateOptions {
		templateId: string;
		tagName?: string;
		className?: string;
		id?: string;
	}

	export function template(options: TemplateOptions): HTMLElement {
		options.tagName = options.tagName || 'div';
		options.className = options.className || '';
		options.id = options.id || '';

		var templateElem = <HTMLTemplateElement>document.getElementById(options.templateId);
		var elem = document.createElement(options.tagName);

		elem.className = options.className;
		elem.id = options.id;
		elem.appendChild(templateElem.content.cloneNode(true));

		return elem;
	}

	export function checkOverflowX(elem: HTMLElement): boolean {
		var currentOverflowX = elem.style.overflowX;

		elem.style.overflowX = 'auto';

		var scrollWidth = elem.scrollWidth;
		var clientWidth = elem.clientWidth;
		var overflowX = scrollWidth > clientWidth;

		elem.style.overflowX = currentOverflowX;

		return overflowX;
	}

	export function checkOverflowY(elem: HTMLElement): boolean {
		var currentOverflowY = elem.style.overflowY;

		elem.style.overflowY = 'auto';

		var scrollHeight = elem.scrollHeight;
		var clientHeight = elem.clientHeight;
		var overflowY = scrollHeight > clientHeight;

		elem.style.overflowY = currentOverflowY;

		return overflowY;
	}

	export function checkOverflow(elem: HTMLElement): boolean {
		return checkOverflowX(elem) || checkOverflowY(elem);
	}

	export function scrollToBottom(elem: HTMLElement): void {
		elem.scrollTop = elem.scrollHeight;
	}

	export function scrollToTop(elem: HTMLElement): void {
		elem.scrollTop = 0;
	}

	export interface ImageSize {
		width: number;
		height: number;
	}
	export function getImageSizeAsync(imageUrl: string): Q.Promise<ImageSize> {
		var deferred = Q.defer<ImageSize>();
		var imageElem = document.createElement('img');

		imageElem.onload = function() {
			deferred.resolve({
				width: imageElem.width,
				height: imageElem.height
			});
		};
		imageElem.onerror = function() {
			deferred.reject('image load error');
		};
		imageElem.src = imageUrl;

		return deferred.promise;
	}

	export function parseStyleSize(value: string): number;
	export function parseStyleSize(value: number): number;
	export function parseStyleSize(value: any): number {
		value = value || 0;
		if (typeof value === 'string') {
			value = parseInt(value.replace('px', ''), 10);
		}
		return value;
	}

	export interface Scales {
		scaleX: number;
		scaleY: number;
	}
	export function getScales(transform: string): Scales {
		var result = {
			scaleX: 1,
			scaleY: 1
		};
		var regExp = /scale\((-?\d*\.?\d+)(?:,\s*(-?\d*\.?\d+))?\)/;
		var matches = transform.match(regExp) || [];
		result.scaleX = matches[1] ? parseFloat(matches[1]) : result.scaleX;
		result.scaleY = matches[2] ? parseFloat(matches[2]) : result.scaleX;
		return result;
	}

	export interface Rotate {
		angle: number;
		unit: string;
	}
	export function getRotate(transform: string): Rotate {
		var result = {
			angle: 0,
			unit: 'deg'
		};
		var regExp = /rotate\((-?\d*\.?\d+)(\S+)\)/;
		var matches = transform.match(regExp) || [];
		result.angle = matches[1] ? parseFloat(matches[1]) : result.angle;
		result.unit = matches[2] ? matches[2] : result.unit;
		return result;
	}

	export function getTransform(elem: HTMLElement): string {
		return elem.style['-webkit-transform'] ||
			elem.style['-moz-transform'] ||
			elem.style['-ms-transform'] ||
			elem.style['transform'] ||
			'';
	}

	export function setTransform(elem: HTMLElement, transform: string): void {
		elem.style['-webkit-transform'] =
		elem.style['-moz-transform'] =
		elem.style['-ms-transform'] =
		elem.style['transform'] = transform;
	}

	export function toTransform(rotate: Rotate, scales: Scales): string {
		var textChunks = [];
		textChunks.push('rotate(');
		textChunks.push(rotate.angle);
		textChunks.push(rotate.unit);
		textChunks.push(') scale(');
		if (scales.scaleX === scales.scaleY) {
			textChunks.push(scales.scaleX);
		}
		else {
			textChunks.push(scales.scaleX);
			textChunks.push(', ');
			textChunks.push(scales.scaleY);
		}
		textChunks.push(')');
		return textChunks.join('');
	}

	export interface RequestHeader {
		key: string;
		value: string
	}
	export interface RequestOptions {
		url: string;
		method?: string;
		data?: string;
		headers?: RequestHeader[]
	}
	export function requestAsync(options: RequestOptions): Q.Promise<string> {
		var url = options.url;
		var method = options.method || 'GET';
		var data = options.data;
		var headers = options.headers || [];

		var request = new XMLHttpRequest();
		var deferred = Q.defer<string>();

		request.open(method, url, true);
		headers.forEach(header => {
			request.setRequestHeader(header.key, header.value);
		});
		request.onload = function() {
			deferred.resolve(request.responseText);
		};
		request.abort = function() {
			deferred.reject('request aborted');
		};
		request.onerror = function() {
			deferred.reject(request.status);
		};
		request.send(data);

		return deferred.promise;
	}
	export function requestSync(options: RequestOptions): string {
		var url = options.url;
		var method = options.method || 'GET';
		var data = options.data;
		var headers = options.headers || [];

		var request = new XMLHttpRequest();

		request.open(method, url, false);
		headers.forEach(header => {
			request.setRequestHeader(header.key, header.value);
		});
		request.send(data);
		return request.responseText;
	}

	initializeTemplates();

}