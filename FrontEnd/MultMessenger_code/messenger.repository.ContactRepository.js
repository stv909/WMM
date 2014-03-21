var messenger = messenger || {};

(function(messenger, eve, abyss, VK) {
	
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
		
		return UserModel;
	})(eve.EventEmitter);
	
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
			this.friends = [];
		}
		
		ContactRepository.prototype.initializeAsync = function() {
			return this._loadGroupsAsync();
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
		ContactRepository.prototype._loadAllFriendsAsync = function() {
			
		};
		
		return ContactRepository;
		
	})(eve.EventEmitter);
	
	
	messenger.repository = messenger.repository || {};
	messenger.repository.ContactRepository = ContactRepository;
	
})(messenger, eve, abyss, VK);