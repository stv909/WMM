var Foo = function() {
	this.x = 30;
	this.y = 10;
};

var Bar = function() {
	Foo.call(this);	
};
Bar.prototype = Object.create(Foo.prototype);
Bar.prototype.constructor = Foo;

var MegaBar = function() {
	Bar.call(this);	
};
MegaBar.prototype = Object.create(Bar.prototype);
MegaBar.prototype.constructor = MegaBar;

var bar = new MegaBar();
console.log(bar instanceof Foo);
console.log(bar instanceof Bar);
console.log(bar instanceof MegaBar);