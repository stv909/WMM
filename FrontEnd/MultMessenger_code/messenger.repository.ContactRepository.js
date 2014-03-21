var messenger = messenger || {};

(function(messenger, eve, abyss, VK) {
	
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
		
		GroupModel.loadAsync = function(count, offset) {
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
			console.log('test');
			return this._loadGroupsAsync();
		};
		ContactRepository.prototype._loadGroupsAsync = function() {
			var self = this;
			var count = 1000;
			var offset = 0;
			
			return GroupModel.loadAsync(count, offset).then(function(groups) {
				console.log(groups);
				if (groups.length) {
					self.groups = self.groups.concat(groups);
					return GroupModel.loadAsync(count, offset + groups.length);
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