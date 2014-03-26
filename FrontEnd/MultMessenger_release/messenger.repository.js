var messenger = messenger || {};

(function(messenger, eve, abyss, VK, text, settings) {
	
	var UserModel = messenger.models.UserModel;
	var GroupModel = messenger.models.GroupModel;
	var TextSearch = text.TextSearch;
	
	var Pagination = (function(base) {
		eve.extend(Pagination, base);
		
		function Pagination(data) {
			base.apply(this, arguments);
			
			this.data = data;
			this.count = 4;
			this.offset = 0;
		}
		
		Pagination.prototype.next = function() {
			var begin = this.offset;
			var end = this.offset + this.count;
			var overflow = end > this.data.length;
			end = overflow ? this.data.length : end;
			
			for (var i = begin; i < end; i++) {
				this.trigger({
					type: 'paginate:item',
					item: this.data[i]
				});
			}
			
			this.offset = end;
			this.isEnd();
		};
		
		Pagination.prototype.isEnd = function() {
			var isEnd = this.offset >= this.data.length;
			if (isEnd) {
				this.trigger({
					type: 'paginate:end'	
				});
			}
		};
		
		Pagination.prototype.dispose = function() {
			this.off();
		};
		
		return Pagination;
	})(eve.EventEmitter);

	var ContactRepository = (function(base) {
		eve.extend(ContactRepository, base);
		
		function ContactRepository() {
			base.apply(this, arguments);
			
			this.groupSearch = null;
			this.userSearch = null;
			
			this.owner = null;
			this.sender = null;
			this.selected = null;
			
			this.senderId = null;
		}
		
		ContactRepository.prototype.setSenderId = function(senderId) {
			this.senderId = senderId;	
		};
		
		ContactRepository.prototype.initializeAsync = function() {
			var self = this;
			return this._loadGroupsAsync().then(function() {
				return self._loadUsersAsync();
			}).then(function() {
				self.searchGroups('');
				self.searchUsers('');
			});
		};
		
		ContactRepository.prototype._loadUsersAsync = function() {
			var self = this;
			var count = 1000;
			var offset = 0;
			var userCollection = [];
			
			var loadFriendsAsync = function(count, offset) {
				var ownerId = self.owner.get('id');
				var senderId = self.sender.get('id');
				
				return UserModel.loadFriendsChunkAsync(count, offset).then(function(friends) {
					var friendCount = friends.length;
					friends = friends.filter(function(friend) {
						var id = friend.get('id');
						return id !== ownerId && id !== senderId;
					});
					userCollection = userCollection.concat(friends);
					if (friendCount) {
						return loadFriendsAsync(count, offset + friendCount);
					} else {
						self.userSearch = new TextSearch(userCollection, function(user) {
							return [user.get('firstName'), user.get('lastName')];
						});
					}
				});
			};
			
			return UserModel.loadOwnAsync().then(function(owner) {
				self.owner = owner;
				userCollection.push(owner);
				self.senderId = self.senderId || self.owner.get('id');
				return UserModel.loadByIdAsync(self.senderId);
			}).then(function(sender) {
				self.sender = sender;
				if (sender.get('id') !== self.owner.get('id')) {
					userCollection.unshift(self.sender);
				}
				return loadFriendsAsync(count, offset);
			});
		};
		
		ContactRepository.prototype._loadGroupsAsync = function() {
			var self = this;
			var count = 1000;
			var offset = 0;
			var groupCollection = [];
			
			var loadGroupsAsync = function(count, offset) {
				return GroupModel.loadChunkAsync(count, offset).then(function(groups) {
					if (groups.length) {
						groupCollection = groupCollection.concat(groups);
						return loadGroupsAsync(count, offset + groups.length);
					} else {
						self.groupSearch = new TextSearch(groupCollection, function(group) {
							return [group.get('name')];
						});
						if (!groupCollection.length) {
							self.trigger('empty:groups');
						}
					}
				});
			};

			return loadGroupsAsync(count, offset);
		};
		
		ContactRepository.prototype.searchUsers = function(query) {
			var users = this.userSearch.search(query);
			var paginableUsers = new Pagination(users);
			paginableUsers.count = 18;
			this.trigger({
				type: 'search:users',
				users: paginableUsers
			});
		};
		
		ContactRepository.prototype.searchGroups = function(query) {
			var groups = this.groupSearch.search(query);
			var paginableGroups = new Pagination(groups);
			paginableGroups.count = 18;
			this.trigger({
				type: 'search:groups',
				groups: paginableGroups
			});
		};
		
		return ContactRepository;
		
	})(eve.EventEmitter);
	
	messenger.repository = messenger.repository || {};
	messenger.repository.Pagination = Pagination;
	messenger.repository.ContactRepository = ContactRepository;
	
})(messenger, eve, abyss, VK, text, settings);