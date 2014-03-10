var template = template || {};

(function(template) {

	var initialize = function() {
		var checkContentAvailable = function() {
			return 'content' in document.createElement('template');
		};
		var loadEventListener = function() {
			window.removeEventListener('load', loadEventListener);

			if (!checkContentAvailable()) {
				var templateElemCollection = document.getElementsByTagName('template');

				for (var i = 0; i < templateElemCollection.length; i++) {
					var templateElem = templateElemCollection[i];
					var childNodes = templateElem.childNodes;
					var content = document.createDocumentFragment();
					
					while(childNodes[0]) {
						content.appendChild(childNodes[0]);
					}

					templateElem.content = content;
				}
			}
		};
		window.addEventListener('load', loadEventListener, false);
	};

	initialize();

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