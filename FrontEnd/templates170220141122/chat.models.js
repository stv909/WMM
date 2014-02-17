var chat = chat || {};

(function(chat, mvp, base64) {
	
	var Model = mvp.Model;
	
	var ContactModel = function() {
		ContactModel.super.apply(this);
	};
	ContactModel.super = Model;
	ContactModel.prototype = Object.create(Model.prototype);
	ContactModel.prototype.constructor = ContactModel;
	ContactModel.create = function(id, name, avatar, type, online, count) {
		var contactModel = new ContactModel();
		
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('avatar', avatar);
		contactModel.setAttribute('type', type);
		contactModel.setAttribute('online', online);
		contactModel.setAttribute('count', count);
		
		return contactModel;
	};
	ContactModel.fromPublic = function(public) {
		var value = public.value || {};
					
		var id = public.id.replace('public.', '');
		var name = value.label || id;
		var author = value.auther || '';
		var moderators = value.moderators || {};
					
		var contactModel = new ContactModel();
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('type', 'public');
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('online', true);
		contactModel.setAttribute('count', 0);
		contactModel.setAttribute('avatar', 'https://cdn3.iconfinder.com/data/icons/linecons-free-vector-icons-pack/32/world-512.png');
		contactModel.setAttribute('author', author);
		contactModel.setAttribute('moderators', moderators);
		
		return contactModel;	
	};
	ContactModel.fromTheme = function(theme) {
		var value = theme.value || {};
		
		var id = theme.id.replace('theme.', '');
		var name = value.label || id;
		var author = value.auther || '';
		
		var contactModel = new ContactModel();
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('type', 'theme');
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('online', true);
		contactModel.setAttribute('count', 0);
		contactModel.setAttribute('avatar', 'http://simpleicon.com/wp-content/uploads/group-1.png');
		contactModel.setAttribute('author', author);
		
		return contactModel;
	};
	ContactModel.fromProfile = function(profile) {
		var value = profile.value || {};
		
		var id = profile.id.replace('profile.', '');
		var name = value.nickname || id;
		var avatar = value.avatar || 'http://simpleicon.com/wp-content/uploads/business-man-1.png';
		
		var contactModel = new ContactModel();
		contactModel.setAttribute('id', id);
		contactModel.setAttribute('type', 'user');
		contactModel.setAttribute('name', name);
		contactModel.setAttribute('online', false);
		contactModel.setAttribute('count', 0);
		contactModel.setAttribute('avatar', avatar);
		
		return contactModel;
	};
	
	var MessageModel = function() {
		MessageModel.super.apply(this);
	};
	MessageModel.super = Model;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;
	MessageModel.prototype.toRawMessage = function() {
		var id = this.getAttribute('id');
		var type = this.getAttribute('type');
		var authorId = this.getAttribute('authorId');
		var receiverId = this.getAttribute('receiverId');
		var timestamp = this.getAttribute('timestamp');
		var content = this.getAttribute('content');

		var rawMessage = chat.MessageFactory.create(id, content, authorId, receiverId, timestamp);
		
		if (type !== 'user') {
			rawMessage.group = receiverId;
			rawMessage.to = '%recipientid%';
		}
		
		return rawMessage;
	};
	MessageModel.fromRawMessage = function(rawMessage) {
		var message = new MessageModel();
		var value = rawMessage.value || {};

		message.setAttribute('id', value.id);
		message.setAttribute('shown', rawMessage.shown);
		message.setAttribute('authorId', value.from);
		message.setAttribute('receiverId', value.group || value.to);
		message.setAttribute('content', base64.decode(value.content));
		message.setAttribute('timestamp', value.timestamp);

		return message;
	};

	chat.models = {
		ContactModel: ContactModel,
		MessageModel: MessageModel
	};
	
})(chat, mvp, base64);