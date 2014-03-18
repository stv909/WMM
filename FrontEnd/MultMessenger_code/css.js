var css = css || {};

(function(css) {
	
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
	
	css.getScales = getScales;
	css.getRotate = getRotate;
	css.toTransform = toTransform;
	
})(css);