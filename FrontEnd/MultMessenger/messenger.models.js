var messenger = messenger || {};

(function(messenger, abyss, base64) {

	var Model = abyss.Model;

	var MessageModel = function() {
		MessageModel.super.apply(this);
	};
	MessageModel.super = Model;
	MessageModel.prototype = Object.create(Model.prototype);
	MessageModel.prototype.constructor = MessageModel;
	MessageModel.fromChatMessage = function(chatMessage) {
		var value = chatMessage.value || {};
		var message = new MessageModel();
		message.set({
			id: value.id || -1,
			content: value.content ? base64.decode(value.content) : '',
			preview: value.preview ? ['http://www.bazelevscontent.net:8582/', value.preview].join('') : null
		});
		return message;
	};

	var ContactModel = function() {
		ContactModel.super.apply(this);
	};
	ContactModel.super = Model;
	ContactModel.prototype = Object.create(Model.prototype);
	ContactModel.prototype.constructor = ContactModel;
	ContactModel.fromVkData = function(rawData) {
		var id = rawData.id;
		var firstName = rawData.first_name;
		var lastName = rawData.last_name;
		var photo = rawData.photo_200 || rawData.photo_100 || rawData.photo_50;
		var contact = new ContactModel();
		contact.set({
			id: id,
			firstName: firstName,
			lastName: lastName,
			photo: photo
		});
		return contact;
	};

	messenger.models = {
		MessageModel: MessageModel,
		ContactModel: ContactModel
	};

})(messenger, abyss, base64);