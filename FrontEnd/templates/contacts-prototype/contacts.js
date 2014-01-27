window.onload = function() {
	console.log('window onload');
	var targetElem = document.getElementById('target');
	var contactElem = template.create('contact-template', { className: 'contact' });
	var avatarElem = contactElem.getElementsByClassName('avatar')[0];
	var nameElem = contactElem.getElementsByClassName('name')[0];
	avatarElem.textContent = 'My avatar';
	nameElem.textContent = 'My name';
	targetElem.appendChild(contactElem);
};