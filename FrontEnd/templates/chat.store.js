var chat = chat || {};

(function(chat) {

	var EventTrigger = mvp.EventTrigger;
	var inherit = mvp.inherit;
	var extend = mvp.extend;

	var Storage = function() {
		Storage.super.constructor.apply(this, arguments);
	};
	inherit(Storage, EventTrigger);
	extend(Storage.prototype, {
		test: function() {
			console.log(this.x);
			console.log(this.y);
			console.log(this.z);
		}
	});

	chat.store = {
		Storage: Storage
	};

})(chat);



