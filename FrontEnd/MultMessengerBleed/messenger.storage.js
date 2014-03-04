var messenger = messenger || {};

(function(messenger, eve) {
	
	var EventEmitter = eve.EventEmitter;
	var ContactModel = messenger.models.ContactModel;
	
	var ContactCollection = function() {
		ContactCollection.super.apply(this);
		var self = this;
		
		self.ownerContact = null;
		self.friendContacts = {};
	};
	ContactCollection.super = EventEmitter;
	ContactCollection.prototype = Object.create(EventEmitter.prototype);
	ContactCollection.prototype.constructor = ContactCollection;
	ContactCollection.prototype.initializeAsync = function() {
		var self = this;
		return self._loadOwnerContactAsync().then(function() {
			return self._loadFriendContactsAsync(1000, 0);
		});
	};
	ContactCollection.prototype._loadOwnerContactAsync = function() {
		var self = this;
		return VK.apiAsync('users.get', {
			fields: [ 'photo_200', 'photo_100', 'photo_50' ].join(','),
			name_case: 'nom',
			v: 5.12
		}).then(function(response) {
			var rawOwnerContact = response[0];
			var ownerContact = ContactModel.fromVkData(rawOwnerContact);
			self.ownerContact = ownerContact;
			self.ownerContact.set({
				firstName: 'Я',
				lastName: '',
			});
		});
	};
	ContactCollection.prototype._loadFriendContactsAsync = function(count, offset) {
		var self = this;
		return VK.apiAsync('friends.get', {
			count: count,
			offset: offset,
			fields: [ 'photo_200', 'photo_100', 'photo_50' ].join(','),
			name_case: 'nom',
			v: 5.12
		}).then(function(response) {
			var rawContacts = response.items;
			var contactCount = rawContacts.length;
			rawContacts.forEach(function(rawContact) {
				var friendContact = ContactModel.fromVkData(rawContact);
				self.friendContacts[friendContact.get('id')] = friendContact;
			});
			if (contactCount !== 0) {
				return self._loadFriendContactsAsync(count, offset + contactCount);
			}
		});
	};
	
	messenger.storage = {
		ContactCollection: ContactCollection
	};
	
})(messenger, eve);