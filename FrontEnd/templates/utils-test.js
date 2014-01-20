var utils = require('./utils');
var Event = utils.Event;

// Foo constructor.
var Foo = function() {
	
	// append Event properties.
	utils.Event.call(this);
	
	// add instance-based additional properties.
	this.items = [];
};

// set Foo prototype from Event prototype without side effect.
Foo.prototype = Object.create(utils.Event.prototype);

// set constructor to the Foo function.
Foo.prototype.constructor = Foo;

// add additional properties shared across all Foo objects.
Foo.prototype.bar = function() {
	this.trigger('bar');	
};

// test
var foo = new Foo();
foo.on('bar', function() {
	console.log('bar listener fired');	
	console.log(Foo.prototype);
	console.log(arguments);
});
foo.bar();
