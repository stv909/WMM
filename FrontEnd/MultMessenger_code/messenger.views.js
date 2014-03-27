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
	
	messenger.views = messenger.views || {};
	messenger.views.PageView = PageView;
	
})(messenger, eve, abyss);