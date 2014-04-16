(function(messenger, eve, abyss, template, analytics) {
	
	var MainMenuView = (function(base) {
		eve.extend(MainMenuView, base);
		
		function MainMenuView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('main-menu-template', { className: 'main-menu' });
			this.logoElem = this.elem.getElementsByClassName('logo')[0];
			this.groupElem = this.elem.getElementsByClassName('group')[0];
			this.itemsElem = this.elem.getElementsByClassName('items')[0];
			this.chatsElem = this.elem.getElementsByClassName('chats')[0];
			this.waitElem = eye.template({
				templateId: 'dialog-wait-template',
				id: 'circularGD'
			});
			
			this.itemViews = [];
			this.previousSelectedItemView = null;
			this.selectedItemView = null;
			
			this.postcardItemView = null;
			this.dialogItemView = null;
			this.conversationItemView = null;
			this.answerItemView = null;
			
			this.initializeItemViews();
			
			this.unreadCount = 0;
			this.initializeUnreadElement();
			
			this.logoElemClickListener = function(event) {
				self.trigger('click:logo');
			};
			this.groupElemClickListener = function(event) {
				window.open(messenger.Settings.groupUrl, '_blank');
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
			this.postcardItemView = new MainMenuItemView('Мульты');
			this.dialogItemView = new MainMenuItemView('Диалоги');
			this.conversationItemView = new MainMenuItemView('Петр Иванов');
			this.answerItemView = new MainMenuItemView('#answer');
			
			this.postcardItemView.attachTo(this.itemsElem);
			this.dialogItemView.attachTo(this.chatsElem);
			this.conversationItemView.attachTo(this.chatsElem);
			
			this.postcardItemView.setClass('postcard-item');
			this.dialogItemView.setClass('lobby-item');
			this.conversationItemView.setClass('conversation-item');
			
			this.postcardItemView.on('select', function(event) {
				self.selectItemView(self.postcardItemView);
				self.enableShadow(false);
				self.trigger('click:postcard');
			});
			this.dialogItemView.on('select', function(event) {
				self.selectItemView(self.dialogItemView);
				self.enableShadow(true);
				self.trigger('click:dialog');
			});
			this.conversationItemView.on('select', function(event) {
				self.selectItemView(self.conversationItemView);
				self.enableShadow(true);
				self.trigger('click:conversation');
			});
			this.answerItemView.on('select', function(event) {
				self.selectItemView(self.answerItemView);
				self.enableShadow(true);
				self.trigger('click:answer');
			});
			
			this.itemViews.push(this.postcardItemView);
			this.itemViews.push(this.dialogItemView);
			this.itemViews.push(this.conversationItemView);
			this.itemViews.push(this.answerItemView);
		};
		MainMenuView.prototype.initializeUnreadElement = function() {
			this.unreadElem = document.createElement('div');
			this.unreadElem.classList.add('hidden');
			this.unreadElem.classList.add('unread');
			this.dialogItemView.elem.appendChild(this.unreadElem);
			this.dialogItemView.elem.appendChild(this.waitElem);
		};
		MainMenuView.prototype.increaseUnreadCount = function() {
			this.unreadCount += 1;
			this.unreadElem.textContent = ['+', this.unreadCount].join('');
			this.unreadElem.classList.remove('hidden');
		};
		MainMenuView.prototype.decreaseUnreadCount = function() {
			this.unreadCount -= 1;
			if (this.unreadCount > 0) {
				this.unreadElem.textContent = ['+', this.unreadCount].join('');
				this.unreadElem.classList.remove('hidden');
			} else {
				this.unreadElem.classList.add('hidden');
			}
		};
		MainMenuView.prototype.selectItemView = function(itemView) {
			if (this.selectedItemView !== itemView) {
				if (this.selectedItemView) {
					this.selectedItemView.deselect();
					this.previousSelectedItemView = this.selectedItemView;
				} else {
					this.previousSelectedItemView = itemView;
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
		MainMenuView.prototype.enableChats = function() {
			this.chatsElem.classList.remove('disabled');
		};
		MainMenuView.prototype.disableLoader = function() {
			this.waitElem.classList.add('hidden');
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
		MainMenuItemView.prototype.setText = function(text) {
			this.elem.textContent = text;	
		};
		
		return MainMenuItemView;
	})(abyss.View);
	
		var PostcardMenuView = (function(base) {
		eve.extend(PostcardMenuView, base);
		
		function PostcardMenuView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('postcard-menu-template', { className: 'postcard-menu' });
			this.breadcrumbsElem = this.elem.getElementsByClassName('breadcrumbs')[0];
			this.cancelElem = this.elem.getElementsByClassName('cancel')[0];
			
			this.itemViews = [];
			this.previousSelectedItemView = null;
			this.selectedItemView = null;
			
			this.selectItemView = null;
			this.editItemView = null;
			this.postItemView = null;
			
			this.initializeItemViews();
			
			var cancelElemClickListener = function() {
				self.trigger('click:cancel');	
			};
			
			this.cancelElem.addEventListener('click', cancelElemClickListener);
			this.once('dispose', function() {
				self.itemViews.forEach(function(itemView) {
					itemView.dispose();	
				});
				self.cancelElem.removeEventListener('click', cancelElemClickListener);
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
				self.selectItemView.enableFlicker(false);
				self.editItemView.enableFlicker(true);
				self.postItemView.enableFlicker(false);
			});
			this.editItemView.on('select', function() {
				self.trigger('click:edit');
				self.chooseItemView(self.editItemView);
				self.selectItemView.enableFlicker(false);
				self.editItemView.enableFlicker(false);
				self.postItemView.enableFlicker(true);
			});
			this.postItemView.on('select', function() {
				self.trigger('click:post');
				self.chooseItemView(self.postItemView);
				self.selectItemView.enableFlicker(false);
				self.editItemView.enableFlicker(false);
				self.postItemView.enableFlicker(false);
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
		PostcardMenuView.prototype.showCancel = function() {
			this.cancelElem.classList.remove('hidden');
		};
		PostcardMenuView.prototype.hideCancel = function() {
			this.cancelElem.classList.add('hidden');
		};
		
		return PostcardMenuView;
	})(abyss.View);
	
	var PostcardMenuItemView = (function(base) {
		eve.extend(PostcardMenuItemView, base);
		
		function PostcardMenuItemView(text) {
			base.apply(this, arguments);
			var self = this;

			this.elem = eye.template({
				templateId: 'postcard-menu-item-template',
				className: 'postcard-menu-item'
			});
			this.nameElem = this.elem.getElementsByClassName('name')[0];
			this.nextElem = this.elem.getElementsByClassName('next')[0];
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
			this.nameElem.textContent = text;
		};
		PostcardMenuItemView.prototype.enableFlicker = function(enable) {
			if (enable) {
				this.elem.classList.add('flicker');
			} else {
				this.elem.classList.remove('flicker');
			}
		};
		
		return PostcardMenuItemView;
	})(abyss.View);
	
	var ConversationMenuView = (function(base) {
		eve.extend(ConversationMenuView, base);
		
		function ConversationMenuView() {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = template.create('conversation-menu-template', { className: 'conversation-menu' });
			this.itemsElem = this.elem.getElementsByClassName('items')[0];
			
			this.itemViews = [];
			this.textItemView = null;
			this.postcardItemView = null;
			this.filmtextItemView = null;
			this.initializeItemViews();
			
			this.once('dispose', function() {
				self.itemViews.forEach(function(itemView) {
					itemView.dispose();	
				});
			});
		}
		
		ConversationMenuView.prototype.initializeItemViews = function() {
			var self = this;
			
			this.filmtextItemView = new ConversationMenuItemView('МультТекст');
			this.postcardItemView = new ConversationMenuItemView('Мульт');
			this.textItemView = new ConversationMenuItemView('Текст');
			
			this.filmtextItemView.elem.classList.add('hidden');
			
			this.filmtextItemView.attachTo(this.itemsElem);
			this.postcardItemView.attachTo(this.itemsElem);
			this.textItemView.attachTo(this.itemsElem);
			
			this.filmtextItemView.on('click', function() {
				self.trigger('click:filmtext');
			});
			this.postcardItemView.on('click', function() {
				self.trigger('click:postcard');
			});
			this.textItemView.on('click', function() {
				self.trigger('click:text');	
			});
			
			this.itemViews.push(this.filmtextItemView);
			this.itemViews.push(this.postcardItemView);
			this.itemViews.push(this.textItemView);
			
			this.filmtextItemView.setAnalytic(function() {
				analytics.send('dialog', 'filmtext_create');	
			});
			this.postcardItemView.setAnalytic(function() {
				analytics.send('dialog', 'card_create');	
			});
			this.textItemView.setAnalytic(function() {
				analytics.send('dialog', 'text_create');	
			});
		};
		
		return ConversationMenuView;
	})(abyss.View);
	
	var ConversationMenuItemView = (function(base) {
		eve.extend(ConversationMenuItemView, base);
		
		function ConversationMenuItemView(text) {
			base.apply(this, arguments);
			var self = this;
			
			this.elem = document.createElement('div');
			this.elem.classList.add('conversation-menu-item');
			this.elem.classList.add('button-special');
			this.setText(text);
			
			this.analyticCallback = function() { };
			
			this.elemClickListener = function(event) {
				self.trigger('click');
				self.analyticCallback();
			};
			this.elem.addEventListener('click', this.elemClickListener);
			this.once('dispose', function() {
				self.elem.removeEventListener('click', self.elemClickListener);
			});
		}
		ConversationMenuItemView.prototype.setText = function(text) {
			this.elem.textContent = text;
		};
		ConversationMenuItemView.prototype.setAnalytic = function(analyticCallback) {
			this.analyticCallback = analyticCallback;
		};
		
		return ConversationMenuItemView;
	})(abyss.View);
	
	messenger.views = messenger.views || {};
	messenger.views.MainMenuView = MainMenuView;
	messenger.views.PostcardMenuView = PostcardMenuView;
	messenger.views.ConversationMenuView = ConversationMenuView;
	
})(messenger, eve, abyss, template, analytics);