var data = data || {};

(function(data) {
	
	var MoodCollection = {
		calm: { value: 'calm', icon: ":-|" }, 
		anger: { value: "anger", icon: ">:(" }, 
		sad: { value: "sad", icon: ":-(" }, 
		happy: { value: "happy", icon: ":-)" }, 
		amaze: { value: "amaze", icon: ":-0" }
	};
	
	var GagCollection = {
		laugh: { value: 'laugh', text: 'смеюсь' },
		facepalm: { value: 'facepalm', text: 'сокрушаюсь' }, 
		confusion: { value: 'confusion', text: 'смущаюсь' },
		cry: { value: 'cry', text: 'плачу' },
		dance: { value: 'dance', text: 'танцую' },
		exaltation: { value: 'exaltation', text: 'радуюсь' }, 
		party: { value: 'party', text: 'праздную' }, 
		puke: { value: 'puke', text: 'тошнит' }, 
		razz: { value: 'razz', text: 'дразнюсь' },
		cake1left: { value: 'cake1left', text: 'кидаюсь тортом влево' },
		cake1right: { value: 'cake1right', text: 'кидаюсь тортом вправо' },
		kiss1left: { value: 'kiss1left', text: 'целую слева' },
		kiss1right: { value: 'kiss1right', text: 'целую справа' }
	};
	
	var ActionCollection = {
		Idle: { value: 'Idle', text: 'бездействую' }, 
		point: { value: 'point', text: 'указываю' },
		time: { value: 'time', text: 'тороплюсь' }, 
		rulez: { value: 'rulez', text: 'одобряю', },
		sucks: { value: 'sucks', text: 'осуждаю' }, 
		applaud: { value: 'applaud', text: 'хлопаю в ладоши' }, 
		fool: { value: 'fool', text: 'возмущаюсь' }, 
		hi: { value: 'hi', text: 'приветствую' }, 
		sun: { value: 'sun', text: 'сияю' }
	};
	
	var AnimationTypeCollection = {
		dialog: { value: 'dialog', image: 'animations/animation.png', minImage: 'animations/animationMin.png', text: 'Полная анимация' },
		pose: { value: 'pose', image: 'animations/pose.png', minImage: 'animations/poseMin.png', text: 'Отрисовать первый кадр анимации' },
		avatar: { value: 'avatar', image: 'animations/avatar.png', minImage: 'animations/avatarMin.png', text: 'Отрисовать только голову персонажа' }
	};
	
	var CharacterCollection = {
		borac: { value: 'borac', image: 'characters/borac.png' },
		bruce: { value: 'bruce', image: 'characters/bruce.png' },
		duke: { value: 'duke', image: 'characters/duke.png' },
		jack: { value: 'jack', image: 'characters/jack.png' },
		joe: { value: 'joe', image: 'characters/joe.png' },
		kate: { value: 'kate', image: 'characters/kate.png' },
		lara: { value: 'lara', image: 'characters/lara.png' },
		madone: { value: 'madone', image: 'characters/madone.png' },
		marina: { value: 'marina', image: 'characters/marina.png' },
		ostap: { value: 'ostap', image: 'characters/ostap.png' },
		pete: { value: 'pete', image: 'characters/pete.png' },
		swann: { value: 'swann', image: 'characters/swann.png' }
	};
	
	var AbilityCollection = {};
	
	Object.keys(CharacterCollection).forEach(function(key) {
		var options = {
			method: 'GET',
			url: [messenger.Settings.abilityBaseUrl, key, '_abilities.v1.json'].join('')
		};
		var responseText = eye.requestSync(options);
		var abilities = JSON.parse(responseText);
		var version = messenger.Settings.version;
		var getFilters = function(object) {
			var validKeys = Object.keys(object).filter(function(key) {
				var isTrue = object[key] === 'true';
				var isTest = object[key] === 'test' && version === 'dev';
				return isTrue || isTest;
			});
			var filters = [];
			validKeys.forEach(function(key) {
				filters.push(key);
			});
			return filters;
		};
		abilities.mood = getFilters(abilities.mood);
		abilities.action = getFilters(abilities.action);
		abilities.gag = getFilters(abilities.gag);
		AbilityCollection[key] = abilities;
	});
	
	data.MoodCollection = MoodCollection;
	data.GagCollection = GagCollection;
	data.ActionCollection = ActionCollection;
	data.AnimationTypeCollection = AnimationTypeCollection;
	data.CharacterCollection = CharacterCollection;
	data.AbilityCollection = AbilityCollection;
	
})(data);