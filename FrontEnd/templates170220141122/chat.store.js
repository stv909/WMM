var chat = chat || {};

(function(chat) {

	var EventTrigger = mvp.EventTrigger;
	var inherit = mvp.inherit;
	var extend = mvp.extend;

	var Storage = function() {
		Storage.super.apply(this, arguments);

		this.account = null;
		this.companion = null;

		this.contacts = {};
		this.messages = {};

		this.companionMessages = [];
	};
	inherit(Storage, EventTrigger);
	extend(Storage.prototype, {
		calculateCompanionMessages: function() {
			var self = this;
			var oldMessages = this.companionMessages;
			var companionId = this.companion.getAttribute('id');
			var keys = Object.keys(this.messages);

			var messages = this.companionMessages = keys.map(function(key) {
				return self.messages[key];
			}).filter(function(message) {
				var authorId = message.getAttribute('authorId');
				var receiverId = message.getAttribute('receiverId');
				var type = message.getAttribute('type');
				return (authorId === companionId && type === 'user') ||
					(receiverId === companionId);
			}).sort(function(message1, message2) {
				var timestamp1 = message1.getAttribute('timestamp');
				var timestamp2 = message2.getAttribute('timestamp');
				if (timestamp1 > timestamp2) {
					return 1;
				} else if (timestamp1 < timestamp2) {
					return -1;
				} else {
					return 0;
				}
			});

			return {
				oldMessages: oldMessages,
				messages: messages
			};
		},
		setAccount: function(account) {
			if (this.account === null ||
				this.account.getAttribute('id') !== account.getAttribute('id')) {
				this.account = account;

				this.trigger({
					type: 'set:account',
					account: this.account
				});
			}
		},
		unsetAccount: function() {
			if (this.account) {
				this.account.off();
				this.account = null;
			}
			this.trigger({
				type: 'unset:account'
			});
		},
		setCompanion: function(companion) {
			if (this.companion === null ||
				this.companion.getAttribute('id') !== companion.getAttribute('id')) {
				this.companion = companion;

				var result = this.calculateCompanionMessages();

				this.trigger({
					type: 'set:companion',
					companion: this.companion,
					oldMessages: result.oldMessages,
					messages: result.messages
				});
			}
		},
		unsetCompanion: function() {
			if (this.companion) {
				this.companion.off();
				this.companion = null;
				this.companionMessages = [];
			}
			this.trigger({
				type: 'unset:companion'
			});
		},
		addContact: function(contact) {
			var id = contact.getAttribute('id');
			this.contacts[id] = contact;
			this.trigger({
				type: 'add:contact',
				contact: contact
			});
		},
		removeContact: function(contactId) {
			this.contacts[contactId].off();
			delete this.contacts[contactId];
			this.trigger({
				type: 'remove:contact',
				contactId: contactId
			});
		},
		removeAllContacts: function() {
			var self = this;
			Object.keys(this.contacts).forEach(function(contactId) {
				self.removeContact(contactId);
			});
		},
		getPublicContactIds: function() {
			var self = this;
			var keys = Object.keys(this.contacts);
			return keys.filter(function(key) {
				return self.contacts[key].getAttribute('type') === 'public';
			});
		},
		getThemeContactIds: function() {
			var self = this;
			var keys = Object.keys(this.contacts);
			return keys.filter(function(key) {
				return self.contacts[key].getAttribute('type') === 'theme';
			});
		},
		getUserContactIds: function() {
			var self = this;
			var accountId = this.account.getAttribute('id');
			var keys = Object.keys(this.contacts);
			return keys.filter(function(key) {
				var contact = self.contacts[key];
				var isUserType = contact.getAttribute('type') === 'user';
				var isAccountId = contact.getAttribute('id') === accountId;
				return isUserType && !isAccountId;
			});
		},
		getOnlineUserContactIds: function() {
			var self = this;
			var accountId = this.account.getAttribute('id');
			var keys = Object.keys(this.contacts);
			return keys.filter(function(key) {
				var contact = self.contacts[key];
				var isUserType = contact.getAttribute('type') === 'user';
				var isAccountId = contact.getAttribute('id') === accountId;
				var isOnline = contact.getAttribute('online')
				return isUserType && !isAccountId && isOnline;
			});
		},
		getOfflineUserContactIds: function() {
			var self = this;
			var accountId = this.account.getAttribute('id');
			var keys = Object.keys(this.contacts);
			return keys.filter(function(key) {
				var contact = self.contacts[key];
				var isUserType = contact.getAttribute('type') === 'user';
				var isAccountId = contact.getAttribute('id') === accountId;
				var isOnline = contact.getAttribute('online')
				return isUserType && !isAccountId && !isOnline;
			});
		},
		addMessage: function(message) {
			var messageId = message.getAttribute('id');
			this.messages[messageId] = message;

			var authorId = message.getAttribute('authorId');
			var receiverId = message.getAttribute('receiverId');
			var shown = message.getAttribute('shown');

			if (!shown) {
				var type = message.getAttribute('type');
				var contact = (type === 'user') ?  this.contacts[authorId] : this.contacts[receiverId];
				var count = contact.getAttribute('count') + 1;
				contact.setAttribute('count', count);
			}

			if (this.companion) {
				var companionId = this.companion.getAttribute('id');
				if (authorId === companionId || receiverId == companionId) {
					this.companionMessages.push(message);
				}
			}

			this.trigger({
				type: 'add:message',
				message: message
			});
		},
		removeMessage: function(messageId) {
			var message = this.messages[messageId];

			var authorId = message.getAttribute('authorId');
			var receiverId = message.getAttribute('receiverId');
			var shown = message.getAttribute('shown');

			if (!shown) {
				var type = message.getAttribute('type');
				var contact = (type === 'user') ?  this.contacts[authorId] : this.contacts[receiverId];
				var count = contact.getAttribute('count') - 1;
				contact.setAttribute('count', count);
			}

			if (this.companion) {
				var companionId = this.companion.getAttribute('id');
				if (authorId === companionId || receiverId == companionId) {
					var index = this.companionMessages.indexOf(message);
					if (index !== -1) {
						this.companionMessages.splice(index, 1);
					}
				}
			}

			message.off();
			delete this.messages[messageId];
			this.trigger({
				type: 'remove:message',
				messageId: messageId,
				shown: shown
			});
		},
		removeAllMessages: function() {
			var self = this;
			Object.keys(this.messages).forEach(function(messageId) {
				self.removeMessage(messageId);
			});
		},
		clear: function() {
			this.removeAllMessages();
			this.removeAllContacts();
			this.unsetAccount();
			this.unsetCompanion();
		}
	});

	chat.store = {
		Storage: Storage
	};

})(chat);



