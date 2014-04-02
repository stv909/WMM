(function(messenger, eve, abyss, template, settings, analytics) {
	
	var PageView = messenger.views.PageView;
	
	var MainMenuView = (function(base) {
		eve.extend(MainMenuView, base);
		
		function MainMenuView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('main-menu-template', { className: 'main-menu' });
			this.logoElem = this.elem.getElementsByClassName('logo')[0];
			this.groupElem = this.elem.getElementsByClassName('group')[0];
			this.itemsElem = this.elem.getElementsByClassName('items')[0];
			
			this.itemViews = [];
			this.selectedItemView = null;
			this.initializeItemViews();
			
			this.logoElemClickListener = function(event) {
				self.trigger('click:logo');
			};
			this.groupElemClickListener = function(event) {
				window.open(settings.groupUrl, '_blank');
				analytics.send('app_start', 'app_go_group');
			};
			
			this.logoElem.addEventListener('click', this.logoElemClickListener);
			this.groupElem.addEventListener('click', this.groupElemClickListener);
			
			this.once('dispose', function() {
				self.logoElem.removeEventListener('click', self.logoElemClickListener);
				self.groupElem.removeEventListener('click', self.groupElemClickListener);
				self.itemViews.forEach(function(itemView) { 
					itemView.dispose();
				});
			});
		}
		
		MainMenuView.prototype.initializeItemViews = function() {
			var self = this;
			var postcardItemView = new MainMenuItemView('Открытки');
			var dialogItemView = new MainMenuItemView('Диалоги');
			var conversationItemView = new MainMenuItemView('Петр Иванов');
			
			postcardItemView.attachTo(this.itemsElem);
			dialogItemView.attachTo(this.itemsElem);
			conversationItemView.attachTo(this.itemsElem);
			
			postcardItemView.setClass('postcard-item');
			dialogItemView.setClass('lobby-item');
			conversationItemView.setClass('conversation-item');
			
			postcardItemView.on('select', function(event) {
				self.trigger('click:postcard');
				self.selectItemView(postcardItemView);
			});
			dialogItemView.on('select', function(event) {
				self.trigger('click:dialog');
				self.selectItemView(dialogItemView);
			});
			conversationItemView.on('select', function(event) {
				self.trigger('click:conversation');
				self.selectItemView(conversationItemView);
			});
			postcardItemView.select();
			
			this.itemViews.push(postcardItemView);
			this.itemViews.push(dialogItemView);
			this.itemViews.push(conversationItemView);
		};
		MainMenuView.prototype.selectItemView = function(itemView) {
			if (this.selectedItemView) {
				this.selectedItemView.deselect();
				this.selectedItemView = null;
			}
			this.selectedItemView = itemView;
		};
		
		return MainMenuView;
	})(abyss.View);
	
	var MainMenuItemView = (function(base) {
		eve.extend(MainMenuItemView, base);
		
		function MainMenuItemView(text) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = document.createElement('div');
			this.elem.classList.add('main-menu-item');
			this.elem.textContent = text;
			
			this.selected = false;
			this.deselect();
			
			this.elemClickListener = function(event) {
				if (!self.selected) {
					self.select();
				}
			};
			this.elem.addEventListener('click', this.elemClickListener);
			this.once('dispose', function() {
				self.elem.removeEventListener('click', self.elemClickListener);
			});
		}
		
		MainMenuItemView.prototype.select = function() {
			this.selected = true;
			this.elem.classList.add('chosen');
			this.elem.classList.remove('normal');
			this.trigger('select');
		};
		MainMenuItemView.prototype.deselect = function() {
			this.selected = false;
			this.elem.classList.add('normal');
			this.elem.classList.remove('chosen');
			this.trigger('deselect');
		};
		MainMenuItemView.prototype.setClass = function(className) {
			this.elem.classList.add(className);
		};
		
		return MainMenuItemView;
	})(abyss.View);
	
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
		}
		
		return PostcardView;
	})(PageView);
	
	var LobbyView = (function(base) {
		eve.extend(LobbyView, base);
		
		function LobbyView() {
			base.apply(this, arguments);
		}
		
		return LobbyView;
	})(PageView);
	
	var ConversationView = (function(base) {
		eve.extend(ConversationView, base);
		
		function ConversationView() {
			base.apply(this, arguments);
		}
		
		return ConversationView;
	})(PageView);
	
	messenger.views = messenger.views || {};
	messenger.views.MainMenuView = MainMenuView;
	messenger.views.MainContainerView = MainContainerView;
	messenger.views.PostcardView = PostcardView;
	messenger.views.ConversationView = ConversationView;
	
})(messenger, eve, abyss, template, settings, analytics);