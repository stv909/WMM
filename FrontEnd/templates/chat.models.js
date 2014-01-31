var chat = chat || {};

(function(chat, mvp) {
	
	var Model = mvp.Model;
	
	var ContactModel = function() {
		ContactModel.super.constructor.apply(this, arguments);
	};
	ContactModel.super = Model.prototype;
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
		MessageModel.super.constructor.apply(this, arguments);	
	};
	MessageModel.super = Model.prototype;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;
	
	chat.models = {
		ContactModel: ContactModel,
		MessageModel: MessageModel
	};
	
})(chat, mvp);