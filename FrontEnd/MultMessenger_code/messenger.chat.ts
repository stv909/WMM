/// <reference path="base64.d.ts" />
/// <reference path="deep.ts" />

module messenger {

	export module chat {

//		export interface ConnectEvent extends deep.Event {
//			socketEvent: Event;
//		}
//		export interface DisconnectEvent extends deep.Event {
//			socketEvent: CloseEvent
//		}
//		export interface SocketErrorEvent extends deep.Event {
//			socketEvent: ErrorEvent
//		}
//		export interface MessageEvent extends deep.Event{
//			response: any
//		}
//		export interface ErrorMessageEvent extends deep.Event {
//			socketEvent: any;
//			exception: Error;
//		}
//
//		export interface IChatClient {
//			on(type: string, callback: (e: deep.Event) => void, context?: any)
//			on(type: 'connect', callback: (e: ConnectEvent) => void, context?: any): void;
//			on(type: 'disconnect', callback: (e: DisconnectEvent) => void, context?: any): void;
//			on(type: 'error', callback: (e: SocketErrorEvent) => void, context?: any): void;
//			on(type: 'error:message', callback: (e: ErrorMessageEvent) => void, context?: any): void;
//
//			once(type: string, callback: (e: deep.Event) => void, context?: any)
//			once(type: 'connect', callback: (e: ConnectEvent) => void, context?: any): void;
//			once(type: 'disconnect', callback: (e: DisconnectEvent) => void, context?: any): void;
//			once(type: 'error', callback: (e: SocketErrorEvent) => void, context?: any): void;
//			once(type: 'error:message', callback: (e: ErrorMessageEvent) => void, context?: any): void;
//		}

		export class ChatClient extends deep.EventEmitter {
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
					socket.removeEventListener('open', openSocketListener);
					socket.removeEventListener('close', closeSocketListener);
					socket.removeEventListener('message', messageSocketListener);
					socket.removeEventListener('error', errorSocketListener);
					self.trigger({
						type: 'disconnect',
						target: self,
						socketEvent: e
					});
				}
				function messageSocketListener(e) {
					var result = self.parseSocketMessage(e);
					if (result.isValid) {
						var response = result.response;
						var type = self.getResponseType(response);
						self.trigger({
							type: type,
							target: self,
							response: response,
							socketEvent: e
						});
					} else {
						self.trigger({
							type: 'error:message',
							target: self,
							socketEvent: e,
							exception: result.exception
						});
					}
				}
				function errorSocketListener(e: ErrorEvent) {
					self.trigger({
						type: 'error',
						target: self,
						socketEvent: e
					});
				}

				this.socket.addEventListener('connect', openSocketListener);
				this.socket.addEventListener('close', closeSocketListener);
				this.socket.addEventListener('message', messageSocketListener);
				this.socket.addEventListener('error', errorSocketListener);
			}

			public disconnect(): void {
				this.socket.close();
			}

			private getResponseType(response): string {
				var type = 'message:unknown';

				if (response.login) {
					type = 'message:login';
				} else if(response.scrape) {
					type = 'message:scrape';
				} else if(response.retrieve) {
					type = 'message:retrieve';
				} else if (response.broadcast) {
					type = 'message:broadcast';
				} else if (response.users) {
					type = 'message:users';
				} else if (response.perlbox) {
					type = 'message:perlbox';
				} else if (response.notify) {
					type = 'message:notify';
				} else if (response.send) {
					type = 'message:send';
				} else if (response.sent) {
					type = 'message:sent';
				} else if (response.tape) {
					type = 'message:tape';
				} else if (response.online) {
					type = 'message:online';
				} else if (response.status) {
					type = 'message:status';
				} else if (response.broadcast) {
					type = 'message:broadcast';
				} else if (response.now) {
					type = 'message:now';
				} else if (response.subscribelist) {
					type = 'message:subscribelist';
				} else if (response.toolrepo) {
					type = 'message:toolrepo';
				} else if (response.groupuserlist) {
					type = 'message:groupuserlist';
				} else if (response.publiclist) {
					type = 'message:publiclist';
				} else if (response.ignore) {
					type = 'message:ignore';
				} else if (response.grouptape) {
					type = 'message:grouptape';
				} else if (response.messagedump) {
					type = 'message:messagedump';
				} else {
					console.log(response);
				}

				return type;
			}
			private parseSocketMessage(socketEvent) {
				var result = {
					isValid: false,
					response: null,
					exception: null
				};

				try {
					var data = socketEvent.data;
					result.response = JSON.parse(data);
					result.isValid = true;
				} catch(e) {
					result.exception = e;
				}

				return result;
			}

			//basic protocol operations
			public login(userId: string): void {
				this.socket.send('login');
				this.socket.send(userId);
			}
			public scrape = function(): void {
				this.socket.send('scrape');
			};
			public store = function(tag: string, id: string, data: string): void {
				var chunks = [];
				if (tag) chunks.push(tag);
				var tagId = chunks.join('.');

				this.socket.send('store');
				this.socket.send(tagId);
				this.socket.send(data);
			};
			public retrieve(idsString: string): void {
				this.socket.send('retrieve');
				this.socket.send(idsString);
			}
			public users(): void {
				this.socket.send('users');
			}
			public tape(): void {
				this.socket.send('tape');
			}
			public cleartape(): void {
				this.socket.send('cleartape');
			}
			public shown(idsString: string): void {
				this.socket.send('shown');
				this.socket.send(idsString);
			}
			public addperl(id: string): void {
				this.socket.send('addperl');
				this.socket.send(['msg', id].join('.'));
			}
			public removeperl(id: string): void {
				this.socket.send('removeperl');
				this.socket.send(['msg', id].join('.'));
			}
			public perlbox(userId: string): void {
				this.socket.send('perlbox');
				this.socket.send(userId);
			}
			public online(): void {
				this.socket.send('online');
			}
			public status(contactId: string): void {
				this.socket.send('status');
				this.socket.send(contactId);
			}
			public notify(tag: string, id: string, toUserId: string, contactMode: string): void {
				var tagIdArray = [tag, id];
				var contactModeIdArray = [toUserId];

				if (contactMode) {
					contactModeIdArray.splice(0, 0, contactMode);
				}

				var tagId = tagIdArray.join('.');
				var contactModeId = contactModeIdArray.join('.');

				this.socket.send('notify');
				this.socket.send(tagId);
				this.socket.send(contactModeId);
			}
			public broadcast(tag: string, id: string, toUserId: string, contactMode: string): void {
				var tagIdArray = [tag, id];
				var contactModeIdArray = [toUserId];

				if (contactMode) {
					contactModeIdArray.splice(0, 0, contactMode);
				}

				var tagId = tagIdArray.join('.');
				var contactModeId = contactModeIdArray.join('.');

				this.socket.send('broadcast');
				this.socket.send(tagId);
				this.socket.send(contactModeId);
			}
			public send(tag: string, id: string, toUserId: string, contactMode: string): void {
				var tagIdArray = [tag, id];
				var contactModeIdArray = [toUserId];

				if (contactMode) {
					contactModeIdArray.splice(0, 0, contactMode);
				}

				var tagId = tagIdArray.join('.');
				var contactModeId = contactModeIdArray.join('.');

				this.socket.send('send');
				this.socket.send(tagId);
				this.socket.send(contactModeId);
			}
			public now(): void {
				this.socket.send('now');
			}
			public subscribelist(): void {
				this.socket.send('subscribelist');
			}
			public subscribe(groupId: string, userId: string): void {
				this.socket.send('subscribe');
				this.socket.send(groupId);
				this.socket.send(userId);
			}
			public unsubscribe(groupId: string, userId: string): void {
				this.socket.send('unsubscribe');
				this.socket.send(groupId);
				this.socket.send(userId);
			}
			public toolrepo(): void {
				this.socket.send('toolrepo');
			}
			public addtool(toolId: string): void {
				this.socket.send('addtool');
				this.socket.send(['tool', toolId].join('.'));
			}
			public removetool(toolId: string): void {
				this.socket.send('removetool');
				this.socket.send(['tool', toolId].join('.'));
			}
			public groupuserlist(groupId: string): void {
				this.socket.send('groupuserlist');
				this.socket.send(groupId);
			}
			public createpublic(id: string): void {
				this.socket.send('createpublic');
				this.socket.send(['public', id].join('.'));
			}
			public createtheme(id: string): void {
				this.socket.send('createtheme');
				this.socket.send(['theme', id].join('.'));
			}
			public publiclist(): void {
				this.socket.send('publiclist');
			}
			public remove(idsString: string): void {
				this.socket.send('delete');
				this.socket.send(idsString);
			}
			public ignore(id: string): void {
				this.socket.send('ignore');
				this.socket.send(id);
			}
			public grouptape(id: string, count: number, offset: number): void {
				this.socket.send('grouptape');
				this.socket.send(id);
				this.socket.send([count, offset].join('/'));
			}
			public messagedump(startTimestamp: number, endTimestamp: number): void {
				this.socket.send('messagedump');
				this.socket.send([startTimestamp, endTimestamp].join('-'));
			}
			//complex protocol operations
			public sendMessage(message: Message, contactMode?: string): void {
				var tag = 'msg';
				var data = JSON.stringify(message);

				this.store(tag, message.id, data);
				this.send(tag, message.id, message.group || message.to, contactMode);
			}
			public notifyMessage(message: Message, contactMode?: string, ignoreStore?: boolean) {
				var tag = 'msg';
				var data = JSON.stringify(message);

				if (!ignoreStore) {
					this.store(tag, message.id, data);
				}
				this.notify(tag, message.id, message.group || message.to, contactMode);
			}
			public broadcastMessage(message: Message, contactMode?: string, ignoreStore?: boolean): void {
				var tag = 'msg';
				var data = JSON.stringify(message);

				if (!ignoreStore) {
					this.store(tag, message.id, data);
				}
				this.broadcast(tag, message.id, message.group || message.to, contactMode);
			}
			public saveTool(tool: Tool): void {
				var data = JSON.stringify(tool);
				this.store('tool', tool.id, data);
				this.addtool(tool.id);
			}
			public deleteTool(toolId: string): void {
				this.removetool(toolId);
			}
		}

		export interface Message {
			id: string;
			content: string;
			from: string;
			to: string;
			group?: string;
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