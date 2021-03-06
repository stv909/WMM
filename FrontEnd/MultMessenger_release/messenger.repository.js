var messenger = messenger || {};

(function(messenger, eve, abyss, Q, text) {
	
	var UserModel = messenger.data.UserModel;
	var GroupModel = messenger.data.GroupModel;
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
			this.chatUserSearch = null;
			
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
						var chatUserCollection = userCollection.filter(function(user) {
							return user !== self.owner;
						});
						self.userSearch = new TextSearch(userCollection, function(user) {
							return [user.get('firstName'), user.get('lastName')];
						});
						self.chatUserSearch = new TextSearch(chatUserCollection, function(user) {
							return [user.get('firstName'), user.get('lastName')];	
						}, true);
						setTimeout(function() {
							self._checkIsAppUsers(userCollection);
						}, 5000);
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

		ContactRepository.prototype._checkIsAppUsers = function(userCollection) {
			var currentIndex = 0;
			var lastIndex = userCollection.length;

			var intervalHandler = setInterval(function() {
				if (currentIndex < lastIndex) {
					userCollection[currentIndex].isAppUserAsync().catch(function(error) {
						console.log(error);
					});
					currentIndex++;
				} else {
					clearInterval(intervalHandler);
					console.log('complete checking is app user');
				}
			}, 500);
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
		
		ContactRepository.prototype.searchChatUsers = function(query) {
			var users = this.chatUserSearch.search(query);
			users.sort(function(user1, user2) {
				var unread1 = user1.get('unread');
				var unread2 = user2.get('unread');
				if (unread1 < unread2) {
					return 1;
				} else if (unread1 > unread2) {
					return -1;
				} else {
					return 0;
				}
			});
			var paginableUsers = new Pagination(users);
			paginableUsers.count = 35;
			this.trigger({
				type: 'search:chat-users',
				chatUsers: paginableUsers
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
		
		ContactRepository.prototype.getFirstNonOwnUser = function(query) {
			var users = this.userSearch.objects;
			var user = null;
			for (var i = 0; i < users.length; i++) {
				if (users[i] !== this.owner) {
					user = users[i];
					break;
				}
			}
			user = user || this.owner;
			return user;
		};
		
		ContactRepository.prototype.getChatUserByVkid = function(vkId) {
			var id = vkId.substring(4);
			var user = this.chatUserSearch.getObjectById(id);
			user = user || this.owner;
			return user;
		};
		
		return ContactRepository;
		
	})(eve.EventEmitter);
	
	var ChatRepository = (function(base) {
		eve.extend(ChatRepository, base);
		
		function ChatRepository(chatClientWrapper) {
			base.apply(this, arguments);
			
			this.chatClientWrapper = chatClientWrapper;
			this.ownProfile = null;
			this.contact = null;
			this.messages = {};
		}
		
		ChatRepository.prototype.loadTapeMessagesAsync = function() {
			var self = this;
			return this.chatClientWrapper.loadTapeAsync().then(function(tape) {
				var messageIds = tape.map(function(item) {
					return item.id;
				});
				var idToShown = {};
				tape.forEach(function(item) {
					idToShown[item.id] = item.shown;
				});
				var rawMessagesPromise = self.chatClientWrapper.getMessagesAsync(messageIds);
				return Q.all([idToShown, rawMessagesPromise]);
			}).spread(function(idToShown, rawMessages) {
				var chatMessages = rawMessages.map(messenger.data.ChatMessageModel.fromRaw);
				chatMessages = chatMessages.filter(function(chatMessage) {
					return chatMessage.isValid();
				});
				chatMessages.sort(function(m1, m2) {
					var timestamp1 = m1.get('timestamp');
					var timestamp2 = m2.get('timestamp');
					if (timestamp1 > timestamp2) {
						return 1;
					} else if (timestamp1 < timestamp2) {
						return -1;
					} else {
						return 0;
					}
				});
				chatMessages.forEach(function(chatMessage) {
					var msgId = ['msg', chatMessage.get('id')].join('.');
					chatMessage.set('shown', idToShown[msgId]);
					self.addMessage(chatMessage, true);
				});
			});
		};
		ChatRepository.prototype.loadSettingsAsync = function(profileId) {
			var self = this;
			return this.chatClientWrapper.getProfileAsync(profileId).then(function(profile) {
				var value = profile.value || {};
				value.settings = value.settings || {};
				value.profileId = profileId;
				self.ownProfile = value;
				
				if (!self.ownProfile.settings.lastContactId) {
					self.trigger({
						type: 'empty:last-contact'
					});
				} else {
				
					self.trigger({
						type: 'update:last-contact',
						lastContactId: self.ownProfile.settings.lastContactId
					});
				}
			});
		};
		ChatRepository.prototype.setContact = function(contact) {
			this.contact = contact;
			this.ownProfile.settings.lastContactId = messenger.misc.Helper.buildVkId(contact);
			this.chatClientWrapper.saveProfileAsync(this.ownProfile.profileId, JSON.stringify(this.ownProfile));
		};
		ChatRepository.prototype.getContact = function() {
			return this.contact;
		};
		ChatRepository.prototype.addMessage = function(message, noSearch) {
			var messageId = message.get('id');
			if (!this.hasMessage(messageId)) {
				this.messages[messageId] = message;
				this.trigger({
					type: 'add:message',
					message: message,
					noSearch: noSearch
				});
			}
		};
		ChatRepository.prototype.getMessage = function(messageId) {
			return this.messages[messageId];
		};
		ChatRepository.prototype.hasMessage = function(messageId) {
			return this.messages.hasOwnProperty(messageId);	
		};
		ChatRepository.prototype.removeMessage = function(messageId) {
			if (this.hasMessage(messageId)) {
				delete this.messages[messageId];
				this.trigger({
					type: 'remove:message',
					messageId: messageId
				});
			}
		};
		
		return ChatRepository;
	})(eve.EventEmitter);
	
	messenger.repository = messenger.repository || {};
	messenger.repository.Pagination = Pagination;
	messenger.repository.ContactRepository = ContactRepository;
	messenger.repository.ChatRepository = ChatRepository;
	
})(messenger, eve, abyss, Q, text);