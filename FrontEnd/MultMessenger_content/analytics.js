var analytics = analytics || {};

(function(analytics) {

	(function(i, s, o, g, r, a, m) {
		i['GoogleAnalyticsObject'] = r;
		i[r] = i[r] || function() {
			(i[r].q = i[r].q || []).push(arguments);
		}, i[r].l = 1 * new Date();
		a = s.createElement(o),
		m = s.getElementsByTagName(o)[0];
		a.async = 1;
		a.src = g;
		m.parentNode.insertBefore(a, m);
	})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

	ga('create', 'UA-46127802-2', 'bazelevscontent.net');
	ga('require', 'displayfeatures');
	ga('send', 'pageview');
	
	var send = function(category, action, label, value) {
		ga('send', 'event', category, action, label, value);
	};
	
	analytics.send = send;

})(analytics);