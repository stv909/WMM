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
			this.previousSelectedItemView = null;
			this.selectedItemView = null;
			
			this.postcardItemView = null;
			this.dialogItemView = null;
			this.conversationItemView = null;
			this.answerItemView = null;
			
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
			this.postcardItemView = new MainMenuItemView('Открытки');
			this.dialogItemView = new MainMenuItemView('Диалоги');
			this.conversationItemView = new MainMenuItemView('Петр Иванов');
			this.answerItemView = new MainMenuItemView('#answer');
			
			this.postcardItemView.attachTo(this.itemsElem);
			this.dialogItemView.attachTo(this.itemsElem);
			this.conversationItemView.attachTo(this.itemsElem);
			
			this.postcardItemView.setClass('postcard-item');
			this.dialogItemView.setClass('lobby-item');
			this.conversationItemView.setClass('conversation-item');
			
			this.postcardItemView.on('select', function(event) {
				self.trigger('click:postcard');
				self.selectItemView(self.postcardItemView);
				self.enableShadow(false);
			});
			this.dialogItemView.on('select', function(event) {
				self.trigger('click:dialog');
				self.selectItemView(self.dialogItemView);
				self.enableShadow(true);
			});
			this.conversationItemView.on('select', function(event) {
				self.trigger('click:conversation');
				self.selectItemView(self.conversationItemView);
				self.enableShadow(true);
			});
			this.answerItemView.on('select', function(event) {
				self.trigger('click:answer');
				self.selectItemView(self.answerItemView);
				self.enableShadow(true);
			});
			
			this.itemViews.push(this.postcardItemView);
			this.itemViews.push(this.dialogItemView);
			this.itemViews.push(this.conversationItemView);
			this.itemViews.push(this.answerItemView);
		};
		MainMenuView.prototype.selectItemView = function(itemView) {
			if (this.selectedItemView !== itemView) {
				if (this.selectedItemView) {
					this.selectedItemView.deselect();
					this.previousSelectedItemView = this.selectedItemView;
				}
				this.selectedItemView = itemView;
			}
		};
		MainMenuView.prototype.enableShadow = function(enable) {
			if (enable) {
				this.elem.classList.add('shadow');
			} else {
				this.elem.classList.remove('shadow');
			}	
		};
		MainMenuView.prototype.restore = function() {
			if (this.previousSelectedItemView) {
				this.previousSelectedItemView.select();
			}	
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
			this.elem.classList.add('hidden');
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
	
	var PostcardMenuView = (function(base) {
		eve.extend(PostcardMenuView, base);
		
		function PostcardMenuView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('postcard-menu-template', { className: 'postcard-menu' });
			this.breadcrumbsElem = this.elem.getElementsByClassName('breadcrumbs')[0];
			
			this.itemViews = [];
			this.previousSelectedItemView = null;
			this.selectedItemView = null;
			
			this.selectItemView = null;
			this.editItemView = null;
			this.postItemView = null;
			
			this.initializeItemViews();
			
			this.once('dispose', function() {
				self.itemViews.forEach(function(itemView) {
					itemView.dispose();	
				});
			});
		}
		
		PostcardMenuView.prototype.initializeItemViews = function() {
			var self = this;
			
			this.selectItemView = new PostcardMenuItemView('1. Выбери мульт!');
			this.editItemView = new PostcardMenuItemView('2. Переделай по-своему!');
			this.postItemView = new PostcardMenuItemView('3. Отправь на стену!');
			
			this.selectItemView.on('select', function() {
				self.trigger('click:select');
				self.chooseItemView(self.selectItemView);
			});
			this.editItemView.on('select', function() {
				self.trigger('click:edit');
				self.chooseItemView(self.editItemView);
			});
			this.postItemView.on('select', function() {
				self.trigger('click:post');
				self.chooseItemView(self.postItemView);
			});
			
			this.selectItemView.attachTo(this.breadcrumbsElem);
			this.editItemView.attachTo(this.breadcrumbsElem);
			this.postItemView.attachTo(this.breadcrumbsElem);
			
			this.itemViews.push(this.selectItemView);
			this.itemViews.push(this.editItemView);
			this.itemViews.push(this.postItemView);
		};
		PostcardMenuView.prototype.chooseItemView = function(itemView) {
			if (this.selectedItemView !== itemView) {
				if (this.selectedItemView) {
					this.selectedItemView.deselect();
					this.previousSelectedItemView = this.selectedItemView;
				}
				this.selectedItemView = itemView;
			}
		};
		PostcardMenuView.prototype.restore = function() {
			if (this.previousSelectedItemView) {
				this.previousSelectedItemView.select();
			}	
		};
		
		return PostcardMenuView;
	})(abyss.View);
	
	var PostcardMenuItemView = (function(base) {
		eve.extend(PostcardMenuItemView, base);
		
		function PostcardMenuItemView(text) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = document.createElement('div');
			this.elem.classList.add('postcard-menu-item');
			this.setText(text);
			
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
		
		PostcardMenuItemView.prototype.select = function() {
			this.selected = true;
			this.elem.classList.add('chosen');
			this.elem.classList.remove('normal');
			this.trigger('select');
		};
		PostcardMenuItemView.prototype.deselect = function() {
			this.selected = false;
			this.elem.classList.add('normal');
			this.elem.classList.remove('chosen');
			this.trigger('deselect');
		};
		PostcardMenuItemView.prototype.setText = function(text) {
			this.elem.textContent = text;
		};
		
		return PostcardMenuItemView;
	})(abyss.View);
	
	messenger.views = messenger.views || {};
	messenger.views.MainMenuView = MainMenuView;
	messenger.views.MainContainerView = MainContainerView;
	messenger.views.PostcardView = PostcardView;
	messenger.views.PostcardMenuView = PostcardMenuView;
	messenger.views.LobbyView = LobbyView;
	messenger.views.ConversationView = ConversationView;
	
})(messenger, eve, abyss, template, settings, analytics);