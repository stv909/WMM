var chat = chat || {};

(function(chat) {

	var EventTrigger = mvp.EventTrigger;
	var inherit = mvp.inherit;
	var extend = mvp.extend;

	var Storage = function() {
		Storage.super.constructor.apply(this, arguments);

		this.account = null;
		this.companion = null;

		this.contacts = {};
		this.messages = {};
	};
	inherit(Storage, EventTrigger);
	extend(Storage.prototype, {
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
			this.account.off();
			this.account = null;
			this.trigger({
				type: 'unset:account'
			});
		},
		setCompanion: function(companion) {
			if (this.companion === null ||
				this.companion.getAttribute('id') !== companion.getAttribute('id')) {
				this.companion = companion;
				this.trigger({
					type: 'set:companion',
					companion: this.companion
				});
			}
		},
		unsetCompanion: function() {
			if (this.companion) {
				this.companion.off();
				this.companion = null;
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
		clear: function() {
			this.unsetAccount();
			this.unsetCompanion();
			this.removeAllContacts();
		}
	});

	chat.store = {
		Storage: Storage
	};

})(chat);



