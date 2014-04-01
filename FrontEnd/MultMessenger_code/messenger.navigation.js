(function(messenger, eve) {
	
	var NavigationItem = (function(base) {
		eve.extend(NavigationItem, base);
		
		function NavigationItem(name) {
			base.apply(this, arguments);
			this.name = name;
		}
		
		NavigationItem.prototype.select = function(options) {
			NavigationItem.trigger({
				type: 'select',
				options: options
			});
		};
		NavigationItem.prototype.deselect = function() {
			this.trigger({
				type: 'deselect'
			});
		};
		
		return NavigationItem;
	})(eve.EventEmitter);

	var Navigation = (function(base) {
		eve.extend(Navigation, base);
		
		function Navigation() {
			base.apply(this, arguments);
			this.navigationItems = {};
		}
		
		Navigation.prototype.add = function(navigationItem) {
			this.navigationItems[navigationItem.name] = navigationItem;
		};
		Navigation.prototype.remove = function(navigationItemName) {
			delete this.navigationItems[navigationItemName];
		};
		
		return Navigation;
	})(eve.EventEmitter);
	
	var answerNavigationItem = new NavigationItem('answer');
	var postcardNavigationItem = new NavigationItem('postcard');
	var dialogsNavigationItem = new NavigationItem('dialogs');
	var conversationNavigationItem = new NavigationItem('conversation');
	
	var selectNavigationItem = new NavigationItem('select');
	var editNavigationItem = new NavigationItem('edit');
	var postNavigationItem = new NavigationItem('post');
	
	messenger.navigation = messenger.navigation || {};
	messenger.navigation.NavigationItem = NavigationItem;
	messenger.navigation.Navigation = Navigation;
	
})(messenger, eve);