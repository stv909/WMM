var messenger = messenger || {};

(function(messenger, abyss, template, analytics, css, html, settings) {
	
	var View = abyss.View;

	var ImageItemView = function(layerImageElem, imageSelectDialog) {
		ImageItemView.super.apply(this);
		var self = this;
		
		this.imageSelectDialog = imageSelectDialog;
		this.elem = template.create('image-item-template', { className: 'image-item' });
		this.imageElem = this.elem.getElementsByClassName('image')[0];
		this.preloaderElem = this.elem.getElementsByClassName('circularImageHolderG')[0];
		
		this.layerImageElem = layerImageElem;
		this.lastValue = this.layerImageElem.src;
		this.imageElem.src = this.layerImageElem.src;
		
		var elemClickListener = function(event) {
			self.imageSelectDialog.show();
			analytics.send('editor', 'photo_change');
			self.imageSelectDialog.once('select:image', function(event) {
				self.setReady(false);
				var image = event.image;
				html.getImageSizeAsync(image).then(function(size) {
					var newImageSize = size;
					var scaleX = self.imageSize.width / newImageSize.width;
					var scaleY = self.imageSize.height / newImageSize.height;
					var scaleFactor = Math.min(scaleX, scaleY); 
					var newScales = {
						scaleX: self.scales.scaleX * scaleFactor,
						scaleY: self.scales.scaleY * scaleFactor
					};
					var newTransform = css.toTransform(self.rotate, newScales);
					css.setTransform(self.layerImageElem, newTransform);
					var offsetLeft = (self.imageSize.width - newImageSize.width) / 2;
					var offsetTop = (self.imageSize.height - newImageSize.height) / 2;
					self.layerImageElem.style.left = (self.left + offsetLeft) + 'px';
					self.layerImageElem.style.top = (self.top + offsetTop) + 'px';
					self.layerImageElem.src = image;
					self.imageElem.src = image;
					
					var styleScaleX = self.oldStyleWidth / newImageSize.width;
					var styleScaleY = self.oldStyleHeight / newImageSize.height;
					var minStyleScale = Math.min(styleScaleX, styleScaleY);
					
					self.imageElem.style.width = parseInt(newImageSize.width * minStyleScale, 10) + 'px';
					self.imageElem.style.height = parseInt(newImageSize.height * minStyleScale, 10) + 'px';
					analytics.send('editor', 'photo_select');
				}).catch(function(error) {
					self.imageElem.src = self.lastValue;
					self.layerImageElem.src = self.lastValue;
				}).fin(function() {
					self.setReady(true);
				});
			});
		};
		
		html.getImageSizeAsync(this.lastValue).then(function(size) {
			self.setReady(true);
			self.elem.addEventListener('click', elemClickListener);
			self.left = css.parseStyleSize(self.layerImageElem.style.left);
			self.top = css.parseStyleSize(self.layerImageElem.style.top);
			self.imageSize = size;
			self.transform = css.getTransform(self.layerImageElem);
			self.rotate = css.getRotate(self.transform);
			self.scales = css.getScales(self.transform);
			self.imageElem.style.width = parseInt(self.imageSize.width * self.scales.scaleX, 10) + 'px';
			self.imageElem.style.height = parseInt(self.imageSize.height * self.scales.scaleY, 10) + 'px';
			self.oldStyleWidth = css.parseStyleSize(self.imageElem.style.width);
			self.oldStyleHeight = css.parseStyleSize(self.imageElem.style.height);
		}).catch(function(error) {
			console.log(error);
			self.elem.classList.add('hidden');
		});
		
		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	ImageItemView.super = View;
	ImageItemView.prototype = Object.create(View.prototype);
	ImageItemView.prototype.constructor = ImageItemView;
	ImageItemView.prototype.setReady = function(ready) {
		if (ready) {
			this.preloaderElem.classList.add('hidden');
			this.elem.classList.add('ready');
			this.imageElem.classList.remove('hidden');
		} else {
			this.preloaderElem.classList.remove('hidden');
			this.elem.classList.remove('ready');
			this.imageElem.classList.add('hidden');
		}
	};
	
	var PhotoItemView = function(imageUrl) {
		PhotoItemView.super.call(this);
		var self = this;
		
		this.elem = template.create('image-item-template', { className: 'image-item' });
		this.imageElem = this.elem.getElementsByClassName('image')[0];
		this.preloaderElem = this.elem.getElementsByClassName('circularImageHolderG')[0];
		this.imageElem.onload = function() {
			if (self.disposed) {
				return;
			}
			self.elem.addEventListener('click', elemClickListener);
			self.preloaderElem.classList.add('hidden');
			self.imageElem.classList.remove('hidden');
			self.elem.classList.add('ready');
		};
		this.imageElem.onerror = function() {
			self.elem.classList.add('hidden');
		};
		this.imageElem.src = imageUrl;
		
		var elemClickListener = function() {
			self.trigger({
				type: 'click:image',
				image: imageUrl
			});
		};
		
		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	PhotoItemView.super = View;
	PhotoItemView.prototype = Object.create(View.prototype);
	PhotoItemView.prototype.constructor = PhotoItemView;
	
	messenger.views = messenger.views || {};

	messenger.views.ImageItemView = ImageItemView;
	messenger.views.PhotoItemView = PhotoItemView;

})(messenger, abyss, template, analytics, css, html, settings);