var css = css || {};

(function(css) {
	
	var parseStyleSize = function(value) {
		value = value || 0;
		if (typeof value === 'string') {
			value = parseInt(value.replace('px', ''), 10);
		}
		return value;
	};
	
	var parseTransformMatrix = function(rawMatrix) {
		var values = rawMatrix.split('(')[1].split(')')[0].split(',');
		var matrix = values.map(function(value) {
			return parseFloat(value);
		});
		return matrix;
	};
	
	var getScales = function(transform) {
		var result = {
			scaleX: 1,
			scaleY: 1
		};
		var regExp = /scale\((-?\d*\.?\d+)(?:,\s*(-?\d*\.?\d+))?\)/;
		var matches = transform.match(regExp) || [];
		result.scaleX = matches[1] ? parseFloat(matches[1]) : result.scaleX;
		result.scaleY = matches[2] ? parseFloat(matches[2]) : result.scaleX;
		return result;
	};
	
	var getRotate = function(transform) {
		var result = {
			angle: 0,
			unit: 'deg'
		};
		var regExp = /rotate\((-?\d*\.?\d+)(\S+)\)/;
		var matches = transform.match(regExp) || [];
		result.angle = matches[1] ? parseFloat(matches[1]) : result.angle;
		result.unit = matches[2] ? matches[2] : result.unit;
		return result;
	};
	
	var getTransform = function(elem) {
		return elem.style['-webkit-transform'] || 
			elem.style['-moz-transform'] ||
			elem.style['-ms-transform'] ||
			elem.style['transform'] ||
			'';
	};
	var setTransform = function(elem, transform) {
		elem.style['-webkit-transform']	= 
		elem.style['-moz-transform'] = 
		elem.style['-ms-transform'] = 
		elem.style['transform'] = transform;
	};
	
	var toTransform = function(rotate, scales) {
		var textChunks = [];
		textChunks.push('rotate(');
		textChunks.push(rotate.angle);
		textChunks.push(rotate.unit);
		textChunks.push(') scale(');
		if (scales.scaleX === scales.scaleY) {
			textChunks.push(scales.scaleX);
		}
		else {
			textChunks.push(scales.scaleX);
			textChunks.push(', ');
			textChunks.push(scales.scaleY);
		}
		textChunks.push(')');
		return textChunks.join('');
	};
	
	css.parseStyleSize = parseStyleSize;
	css.parseTransformMatrix = parseTransformMatrix;
	css.getScales = getScales;
	css.getRotate = getRotate;
	css.getTransform = getTransform;
	css.setTransform = setTransform;
	css.toTransform = toTransform;
	
})(css);