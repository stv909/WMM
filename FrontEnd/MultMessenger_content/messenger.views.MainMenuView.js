(function(messenger, eve, abyss, template, settings, analytics) {
	
	var PageView = messenger.views.PageView;
	
	var MainContainerView = (function(base) {
		eve.extend(MainContainerView, base);
		
		function MainContainerView() {
			base.apply(this, arguments);
			
			this.elem = document.createElement('div');
			this.elem.classList.add('main-container');
		}
		
		return MainContainerView;
	})(abyss.View);
	
	var PostcardView = (function(base) {
		eve.extend(PostcardView, base);
		
		function PostcardView() {
			base.apply(this, arguments);
			
			this.elem = document.createElement('div');
			this.elem.classList.add('postcard');
			this.elem.classList.add('hidden');
		}
		
		return PostcardView;
	})(PageView);
	
	messenger.views = messenger.views || {};
	messenger.views.MainContainerView = MainContainerView;
	messenger.views.PostcardView = PostcardView;
	
})(messenger, eve, abyss, template, settings, analytics);