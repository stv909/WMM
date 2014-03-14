var html = html || {};

(function(html) {

	var pasteHtmlAtElement = function(targetElem, html) {
		if (targetElem.contentEditable === 'false') {
			return;
		}

		targetElem.focus();
		var sel = window.getSelection();
		if (sel.baseNode && sel.baseNode.id !== targetElem.id &&
			(!sel.baseNode.parentElement || sel.baseNode.parentElement.id !== targetElem.id)) {
			return;
		}
		if (sel.getRangeAt && sel.rangeCount) {
			var range = sel.getRangeAt(0);
			range.deleteContents();

			// Range.createContextualFragment() would be useful here but is
			// non-standard and not supported in all browsers (IE9, for one)
			var el = document.createElement('div');
			el.innerHTML = html;
			var frag = document.createDocumentFragment();
			var node, lastNode;
			while ((node = el.firstChild)) {
				lastNode = frag.appendChild(node);
			}
			range.insertNode(frag);

			// Preserve the selection
			if (lastNode) {
				range = range.cloneRange();
				range.setStartAfter(lastNode);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	};

	var checkElemOverflowX = function(elem) {
		var currentOverflowX = elem.style.overflowX;

		elem.style.overflowX = 'auto';

		var scrollWidth = elem.scrollWidth;
		var clientWidth = elem.clientWidth;
		var overflowX = scrollWidth > clientWidth;

		elem.style.overflowX = currentOverflowX;

		return overflowX;
	};
	
	var checkElemOverflowY = function(elem) {
		var currentOverflowY = elem.style.overflowY;

		elem.style.overflowY = 'auto';

		var scrollHeight = elem.scrollHeight;
		var clientHeight = elem.clientHeight;
		var overflowY = scrollHeight > clientHeight;

		elem.style.overflowY = currentOverflowY;

		return overflowY;
	};
	
	var checkElemOverflow = function(elem) {
		return checkElemOverflowX(elem) || checkElemOverflowY(elem);
	};
	
	var scrollToBottom = function(elem) {
		elem.scrollTop = elem.scrollHeight;
	};
	var scrollToTop = function(elem) {
		elem.scrollTop = 0;	
	};
	
	var normalizeWheelDelta = function() {
		var distribution = [];
		var done = null;
		var scale = 30;
		return function(n) {
			if (n === 0) {
				return n;
			}
			if (done !== null) {
				return n * done;
			}
			var abs = Math.abs(n);
			outer: do {
				for (var i = 0; i < distribution.length; ++i) {
					if (abs <= distribution[i]) {
						distribution.splice(i, 0, abs);
						break outer;
					}
				}
				distribution.push(abs);
			} while (false);
			var factor = scale / distribution[Math.floor(distribution.length / 3)];
			if (distribution.length == 500) {
				done = factor;
			}
			return n * factor;
		};
	}();
	
	html.pasteHtmlAtElement = pasteHtmlAtElement;
	html.checkElemOverflowY = checkElemOverflowX;
	html.checkElemOverflowY = checkElemOverflowY;
	html.checkElemOverflow = checkElemOverflow;
	html.scrollToBottom = scrollToBottom;
	html.scrollToTop = scrollToTop;
	html.normalizeWheelDelta = normalizeWheelDelta;

})(html);