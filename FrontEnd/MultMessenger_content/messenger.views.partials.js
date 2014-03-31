var messenger = messenger || {};

(function(messenger, abyss, template, analytics, css, html) {
	
	var View = abyss.View;
	
	var MessageView = function(model) {
		MessageView.super.apply(this);

		this.model = model;
		this.elem = template.create('message-template', { className: 'message' });
		this.contentElem = this.elem.getElementsByClassName('content')[0];

		this.selected = false;
	};
	MessageView.super = View;
	MessageView.prototype = Object.create(View.prototype);
	MessageView.prototype.constructor = MessageView;
	MessageView.prototype.select = function() {
		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
		this.removeCachedElem();
		this.addCachedElem(this.getCachedFullElem());
		this.trigger({
			type: 'select',
			message: this.model
		});
	};
	MessageView.prototype.deselect = function() {
		this.selected = false;
		this.elem.classList.remove('chosen');
		this.elem.classList.add('normal');
		this.removeCachedElem();
		this.addCachedElem(this.cachedPreviewElem);
	};
	MessageView.prototype.addCachedElem = function(cachedElem) {
		this.cachedElem = cachedElem;
		this.contentElem.appendChild(cachedElem);
	};
	MessageView.prototype.removeCachedElem = function() {
		if (this.cachedElem) {
			this.contentElem.removeChild(this.cachedElem);
		}
	};
	MessageView.prototype.prepareCachedPreviewElem = function() {
		this.cachedPreviewElem = document.createElement('div');
		var imgElem = document.createElement('img');
		imgElem.src = this.model.get('preview');
		this.cachedPreviewElem.appendChild(imgElem);
	};
	MessageView.prototype.prepareCachedFullElem = function() {
		this.cachedFullElem = document.createElement('div');
		this.cachedFullElem.innerHTML = this.model.get('content');
	};
	MessageView.prototype.getCachedFullElem = function() {
		if (!this.cachedFullElem) {
			this.prepareCachedFullElem();
		}
		return this.cachedFullElem;
	};
	MessageView.prototype.setModel = function(model, full) {
		this.model = model;
		this.removeCachedElem();
		this.prepareCachedPreviewElem();
		if (full) {
			this.prepareCachedFullElem();
		}
		if (this.selected) {
			this.addCachedElem(this.getCachedFullElem());
		} else {
			this.addCachedElem(this.cachedPreviewElem);
		}
	};
	
	var MessagePatternView = function(model) {
		MessagePatternView.super.apply(this, arguments);
		var self = this;

		this.prepareCachedPreviewElem();
		//this.prepareCachedFullElem();
		this.deselect();

		var elemClickListener = function(event) {
			if (!self.selected) {
				self.select();
				analytics.send('tape', 'msg_select_new');
			}
		};

		this.elem.addEventListener('click', elemClickListener, this);

		this.once('dispose', function() {
			self.elem.removeEventListener('click', elemClickListener);
		});
	};
	MessagePatternView.super = MessageView;
	MessagePatternView.prototype = Object.create(MessageView.prototype);
	MessagePatternView.prototype.constructor = MessagePatternView;
	
	var MessageEditorView = function() {
		MessageEditorView.super.apply(this);

		this.selected = true;
		this.elem.classList.add('chosen');
		this.elem.classList.remove('normal');
	};
	MessageEditorView.super = MessageView;
	MessageEditorView.prototype = Object.create(MessageView.prototype);
	MessageEditorView.prototype.constructor = MessageEditorView;
	MessageEditorView.prototype.setModel = function(model) {
		MessageEditorView.super.prototype.setModel.apply(this, [model, true]);
		this.trigger({
			type: 'change:content',
			elem: this.cachedFullElem
		});
	};
	
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
	
	messenger.views.MessageView = MessageView;
	messenger.views.MessagePatternView = MessagePatternView;
	messenger.views.MessageEditorView = MessageEditorView;
	messenger.views.ImageItemView = ImageItemView;
	messenger.views.PhotoItemView = PhotoItemView;

})(messenger, abyss, template, analytics, css, html);