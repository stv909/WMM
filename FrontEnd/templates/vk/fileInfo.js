var path = require('path');

var imageMimes = {
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpg',
	'.png': 'image/png',
	'.gif': 'image/gif'
};

var getImageMime = function(extname) {
	extname = extname.toLowerCase();
	var mime = imageMimes[extname];
	if (mime) {
		return mime;
	} else {
		throw new Error('unknown image mime');
	}
};

var getImageInfo = function(imageUri) {
	var fileName = path.basename(imageUri);
	var extName = path.extname(fileName);
	var fileMime = getImageMime(extName);
	
	return {
		fileName: fileName,
		fileMime: fileMime
	};
};


