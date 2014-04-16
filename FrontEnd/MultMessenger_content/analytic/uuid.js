var uuid = uuid || {};

(function(uuid) {

	var v4 = function() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
		});
		return uuid;
	};

	uuid.v4 = v4;

	if (typeof(module) !== typeof(undefined)) {
		module.exports = uuid;
	}

})(uuid);