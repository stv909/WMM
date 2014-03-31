var messenger = messenger || {};

(function(messenger, eve, abyss) {
	
	var PageView = (function(base) {
		eve.extend(PageView, base);
		
		function PageView() {
			base.apply(this, arguments);
		}
		
		PageView.prototype.show = function() {
			this.elem.classList.remove('hidden');	
		};
		
		PageView.prototype.hide = function() {
			this.elem.classList.add('hidden');
		};
		
		return PageView;
	})(abyss.View);
	
	var DialogView = (function(base) {
		eve.extend(DialogView, base);
		
		function DialogView() {
			base.apply(this, arguments);
			
			this.elem = document.getElementById('dialog-background');
			this.dialogWindowElem = null;
		}
		
		DialogView.prototype.show = function() {
			this.elem.classList.remove('hidden');
			this.dialogWindowElem.classList.remove('hidden');
		};
		DialogView.prototype.hide = function() {
			this.elem.classList.add('hidden');
			this.dialogWindowElem.classList.add('hidden');
		};
		
		return DialogView;
	})(abyss.View);
	
	messenger.views = messenger.views || {};
	messenger.views.PageView = PageView;
	messenger.views.DialogView = DialogView;
	
})(messenger, eve, abyss);