var template = template || {};

(function(template) {

	var create = function(templateId, settings) {
		settings = settings || {};

		var tagName = settings.tagName || 'div';
		var id = settings.id || '';
		var className = settings.className || '';

		var template = document.getElementById(templateId);
		var elem = document.createElement(tagName);

		elem.className = className;
		elem.id = id;
		elem.appendChild(template.content.cloneNode(true));

		return elem;
	};

	template.create = create;

})(template);