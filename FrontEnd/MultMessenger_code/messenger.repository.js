var messenger = messenger || {};

(function(messenger, eve, abyss, template, Q, VK, settings, analytics) {
	
	var UserModel = messenger.models.UserModel;
	var GroupModel = messenger.models.GroupModel;
	
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
			
			this.groups = [];
			this.users = [];
			this.owner = null;
			
			this.senderId = '1';
		}
		
		ContactRepository.prototype.initializeAsync = function() {
			var self = this;
			return this._loadUsersAsync().then(function() {
				return self._loadGroupsAsync();
			});
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
	messenger.repository.Pagination = Pagination;
	messenger.repository.ContactRepository = ContactRepository;
	
})(messenger, eve, abyss, template, Q, VK, settings, analytics);