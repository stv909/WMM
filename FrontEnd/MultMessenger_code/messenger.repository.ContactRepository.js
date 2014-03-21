var messenger = messenger || {};

(function(messenger, eve, abyss, Q, VK) {
	
	var UserModel = (function(base) {
		eve.extend(UserModel, base);
		
		function UserModel() {
			base.apply(this, base);
		}
		
		UserModel.prototype.getFullName = function() {
			return [this.get('firstName'), this.get('lastName')].join(' ');	
		};
		
		UserModel.fromRaw = function(rawUser) {
			var user = new UserModel();
			
			user.set({
				id: rawUser.id,
				firstName: rawUser.first_name,
				lastName: rawUser.last_name,
				photo: rawUser.photo_200 || rawUser.photo_100 || rawUser.photo_50,
				canPost: rawUser.can_post
			});
			
			return user;
		};
		
		UserModel.loadOwnAsync = function() {
			return VK.apiAsync('users.get', {
				fields: [ 'photo_200', 'photo_100', 'photo_50', 'can_post' ].join(','),
				name_case: 'nom',
				https: 1,
				v: 5.12	
			}).then(function(response) {
				return UserModel.fromRaw(response[0]);
			});
		};
		
		UserModel.loadByIdAsync = function(id) {
			return VK.apiAsync('users.get', {
				user_ids: id,
				fields: [ 'photo_200', 'photo_100', 'photo_50', 'can_post' ].join(','),
				name_case: 'nom',
				https: 1,
				v: 5.12	
			}).then(function(response) {
				return UserModel.fromRaw(response[0]);
			});
		};
		
		UserModel.loadFriendsChunkAsync = function(count, offset) {
			return VK.apiAsync('friends.get', {
				count: count,
				offset: offset,
				fields: [ 'photo_200', 'photo_100', 'photo_50', 'can_post' ].join(','),
				name_case: 'nom',
				https: 1,
				v: 5.12
			}).then(function(response) {
				return response.items.map(UserModel.fromRaw);
			});
		};
		
		return UserModel;
	})(abyss.Model);
	
	var GroupModel = (function(base) {
		eve.extend(GroupModel, base)
	
		function GroupModel() {
			base.apply(this, arguments);	
		}
		
		GroupModel.fromRaw = function(rawGroup) {
			var group = new GroupModel();
			
			group.set({
				id: -rawGroup.id,
				name: rawGroup.name,
				photo: rawGroup.photo_200 || rawGroup.photo_100 || rawGroup.photo_50,
				canPost: rawGroup.can_post
			});
			
			return group;
		};
		
		GroupModel.loadChunkAsync = function(count, offset) {
			return VK.apiAsync('groups.get', {
				extended: 1,
				fields: ['photo_200', 'photo_100', 'photo_50', 'can_post'].join(','),
				offset: offset,
				count: count,
				v: 5.12
			}).then(function(response) {
				return response.items.map(GroupModel.fromRaw);
			});
		};
		
		return GroupModel;
	})(abyss.Model);
	
	var ContactRepository = (function(base) {
		eve.extend(ContactRepository, base);
		
		function ContactRepository() {
			base.apply(this, arguments);
			
			this.groups = [];
			this.users = [];
			this.owner = null;
			
			this.senderId = '1';
		}
		
		ContactRepository.prototype.initializeAsync = function() {
			return Q.all([this._loadUsersAsync(), this._loadGroupsAsync()]);
		};
		
		ContactRepository.prototype._loadUsersAsync = function() {
			var self = this;
			var count = 1000;
			var offset = 0;
			
			var loadFriendsAsync = function(count, offset) {
				var ownerId = self.owner.get('id');
				var senderId = self.sender.get('id');
				
				return UserModel.loadFriendsChunkAsync(count, offset).then(function(friends) {
					var friendCount = friends.length;
					friends = friends.filter(function(friend) {
						var id = friend.get('id');
						return id !== ownerId && id !== senderId;
					});
					self.users = self.users.concat(friends);
					if (friendCount) {
						return loadFriendsAsync(count, offset + friendCount);
					}
				});
			};
			
			return UserModel.loadOwnAsync().then(function(owner) {
				self.owner = owner;
				self.users.push(owner);
				self.senderId = self.senderId || self.owner.get('id');
				return UserModel.loadByIdAsync(self.senderId);
			}).then(function(sender) {
				self.sender = sender;
				if (sender.get('id') !== self.owner.get('id')) {
					self.users.unshift(self.sender);
				}
				return loadFriendsAsync(count, offset);
			});
		};
		
		ContactRepository.prototype._loadGroupsAsync = function() {
			var self = this;
			var count = 1000;
			var offset = 0;
			return GroupModel.loadChunkAsync(count, offset).then(function(groups) {
				if (groups.length) {
					self.groups = self.groups.concat(groups);
					return GroupModel.loadChunkAsync(count, offset + groups.length);
				}
			});
		};
		
		return ContactRepository;
		
	})(eve.EventEmitter);
	
	
	messenger.repository = messenger.repository || {};
	messenger.repository.ContactRepository = ContactRepository;
	
})(messenger, eve, abyss, Q, VK);