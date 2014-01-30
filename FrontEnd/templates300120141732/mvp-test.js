var mvp = require('./mvp');

var model = new mvp.Model();

model.on('change:firstName', function(event) {
	console.log('change:firstName');
	console.log(event);
});
model.on('remove:firstName', function(event) {
	console.log('remove:firstName');
	console.log(event);	
});

model.setAttribute('firstName', 'name');
model.unsetAttribute('firstName');
