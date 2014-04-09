/// <reference path="base64.d.ts" />
/// <reference path="deep.ts" />

module messenger {

	export module chat {

		export interface ConnectEvent extends deep.Event {
			socketEvent: Event;
		}
		export interface DisconnectEvent extends deep.Event {
			socketEvent: CloseEvent
		}

		export interface IChatClient {
			on(type: string, callback: (e: deep.Event) => void, context?: any)
			on(type: 'connect', callback: (e: ConnectEvent) => void, context?: any): void;
			on(type: 'disconnect', callback: (e: DisconnectEvent) => void, context?: any): void;

			once(type: string, callback: (e: deep.Event) => void, context?: any)
			once(type: 'connect', callback: (e: ConnectEvent) => void, context?: any): void;
			once(type: 'disconnect', callback: (e: DisconnectEvent) => void, context?: any): void;
		}

		export class ChatClient extends deep.EventEmitter implements IChatClient {
			private socket: WebSocket;
			private serverUrl: string;

			public constructor(serverUrl: string) {
				super();
				this.serverUrl = serverUrl;
			}

			public connect(): void {
				var self = this;
				this.socket = new WebSocket(this.serverUrl);

				function openSocketListener(e: Event) {
					self.trigger({
						type: 'connect',
						target: self,
						socketEvent: e
					});
				}
				function closeSocketListener(e: CloseEvent) {
					var socket = e.srcElement;
					self.trigger({
						type: 'disconnect',
						target: self,
						socketEvent: e
					});
				}
				function messageSocketListener(e) {

				}
				function errorSocketListener(e: ErrorEvent) {

				}

				this.socket.addEventListener('connect', openSocketListener);
				this.socket.addEventListener('close', closeSocketListener);
				this.socket.addEventListener('message', messageSocketListener);
				this.socket.addEventListener('error', errorSocketListener);
			}
		}

		var chatClient = new ChatClient('test');
		chatClient.on('connect', (e) => {

		});

		export interface Message {
			id: string;
			content: string;
			from: string;
			to: string;
			timestamp?: number;
			preview?: string;
		}
		export class MessageFactory {
			public static encode(message: Message): Message {
				message.content = base64.encode(message.content);
				return message;
			}
			public static decode(message: Message): Message {
				message.content = base64.decode(message.content);
				return message;
			}
		}

		export interface Tool {
			id: string;
			label: string;
			content: string;
		}
		export class ToolFactory {
			public static encode(tool: Tool): Tool {
				tool.content = base64.encode(tool.content);
				return tool;
			}
			public static decode(tool: Tool): Tool {
				tool.content = base64.decode(tool.content);
				return tool;
			}
 		}

	}

}