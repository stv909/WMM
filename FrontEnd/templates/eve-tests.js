var EventEmitter = require('./eve').EventEmitter;

var em = new EventEmitter();
em.once('test', function() {
	console.log('test once');
});
em.on('test', function() {
	console.log('test multiple');
});

var Foo = function() {
	this.x = 30;
};
Foo.prototype.printX = function() {
	console.log(this.x);
};
var foo = new Foo();

var callback = function(event) {
	console.log(this);
};
em.on('test', foo.printX, foo);
em.on('test', callback, em);
em.on('test', callback, this);
em.off('test', callback, this);

em.trigger('test');
em.trigger('test');