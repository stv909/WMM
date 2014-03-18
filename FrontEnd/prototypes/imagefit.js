window.onload = function() {
	var data = '<img class="image" src="http://www.theapphouse.com/images/app_store.png" class="image-editable" style="position: absolute; left: 150px; top: 50px; -webkit-transform: scale(1) rotate(10deg)">' + '<img class="image" src="https://lh4.googleusercontent.com/-RUyzcGAdX4c/UZHzGP8QXVI/AAAAAAAABds/_gBEWmaF_eQ/s64-no/windows.jpg" class="image-editable" style="position: absolute; left: 100px; top: 150px">' + '<img class="image" src="http://nw-sb.com/wp-content/uploads/2014/01/065f0b43-6498-4d3d-bc65-75b941791a68.png" class="image-editable" style="position: absolute; left: 200px; top: 200px; -webkit-transform: rotate(-45deg) scale(0.5)">';
	var images = ['http://www.theapphouse.com/images/app_store.png', 'https://lh4.googleusercontent.com/-RUyzcGAdX4c/UZHzGP8QXVI/AAAAAAAABds/_gBEWmaF_eQ/s64-no/windows.jpg', 'http://nw-sb.com/wp-content/uploads/2014/01/065f0b43-6498-4d3d-bc65-75b941791a68.png'];

	var index1 = 1;
	var index2 = 2;
	var index3 = 0;

	var mode = true;

	var containerElem = document.getElementById('container');

	var switch1Elem = document.getElementById('switch1');
	var switch2Elem = document.getElementById('switch2');
	var switch3Elem = document.getElementById('switch3');

	switch1Elem.addEventListener('click', function() {
		if (index1 >= images.length) index1 = 0;
		imageElem1.src = images[index1];
		index1++;
	});
	switch2Elem.addEventListener('click', function() {
		if (index2 >= images.length) index2 = 0;
		imageElem2.src = images[index2];
		index2++;
	});
	switch3Elem.addEventListener('click', function() {
		if (index3 >= images.length) index3 = 0;
		imageElem3.src = images[index3];
		index3++;
	});

	containerElem.innerHTML = data;

	var imageElem1 = containerElem.getElementsByClassName('image')[0];
	var imageElem2 = containerElem.getElementsByClassName('image')[1];
	var imageElem3 = containerElem.getElementsByClassName('image')[2];

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

	var firstImageLoadListener = function(event) {
		var target = event.target;
		var width = target.offsetWidth;
		var height = target.offsetHeight;
		var left = parseStyleSize(target.style.left);
		var top = parseStyleSize(target.style.top);
		var lastUrl = target.src;
		var transform = target.style['-webkit-transform'];
		var scales = getScales(transform);
		var rotate = getRotate(transform);

		target.removeEventListener('load', firstImageLoadListener);
		target.addEventListener('load', function() {
			var newWidth = target.offsetWidth;
			var newHeight = target.offsetHeight;
			//var scaleFactor = (mode) ? (height / newHeight) : (width / newWidth);
			var scaleX = width / newWidth;
			var scaleY = height / newHeight;
			var scaleFactor = Math.min(scaleX, scaleY);
			var newScales = {
				scaleX: scales.scaleX * scaleFactor,
				scaleY: scales.scaleY * scaleFactor
			};
			var newTransform = toTransform(rotate, newScales);
			target.style['-webkit-transform'] = newTransform;
			var offsetLeft = (width - newWidth) / 2;
			var offsetTop = (height - newHeight) / 2;
			target.style.left = (left + offsetLeft) + 'px';
			target.style.top = (top + offsetTop) + 'px';
			lastUrl = target.src;
		});
		target.addEventListener('error', function() {
			target.src = lastUrl;
		});
		target.addEventListener('click', function() {
			lastUrl = target.src;
			var newUrl = prompt('new url', lastUrl);
			if (newUrl && newUrl !== '') {
				target.src = newUrl;
			}
		});
	};

	imageElem1.addEventListener('load', firstImageLoadListener);
	imageElem2.addEventListener('load', firstImageLoadListener);
	imageElem3.addEventListener('load', firstImageLoadListener);
};