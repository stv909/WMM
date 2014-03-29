var data = data || {};

(function(data) {
	
	var MoodCollection = [
		{ value: 'calm', icon: ":-|" }, 
		{ value: "angry", icon: ">:(" }, 
		{ value: "sad", icon: ":-(" }, 
		{ value: "happy", icon: ":-)" }, 
		{ value: "amaze", icon: ":-0" }
	];
	
	var GagCollection = [
		{ value: 'laugh', text: 'смеюсь' },
		{ value: 'facepalm', text: 'сокрушаюсь' }, 
		{ value: 'confusion', text: 'смущаюсь' },
		{ value: 'cry', text: 'плачу' },
		{ value: 'dance', text: 'танцую' },
		{ value: 'exaltation', text: 'радуюсь' }, 
		{ value: 'party', text: 'праздную' }, 
		{ value: 'puke', text: 'болею' }, 
		{ value: 'razz', text: 'дразнюсь' },
		{ value: 'cake1left', text: 'кидаюсь тортом влево' },
		{ value: 'cake1right', text: 'кидаюсь тортом вправо' }
	];
	
	var ActionCollection = [
		{ value: 'Idle', text: 'бездействую' }, 
		{ value: 'point', text: 'указываю' },
		{ value: 'time', text: 'тороплюсь' }, 
		{ value: 'rulez', text: 'одобряю', },
		{ value: 'sucks', text: 'осуждаю' }, 
		{ value: 'applaud', text: 'аплодирую' }, 
		{ value: 'fool', text: 'возмущаюсь' }, 
		{ value: 'hi', text: 'приветствую' }, 
		{ value: 'sun', text: 'сияю' }
	];
	
	var AnimationTypeCollection = [
		{ value: 'dialog', image: 'animations/animation.png', text: 'Полная анимация' },
		{ value: 'pose', image: 'animations/pose.png', text: 'Отрисовать первый кадр анимации' },
		{ value: 'avatar', image: 'animations/avatar.png', text: 'Отрисовать только голову персонажа' }
	];
	
	var CharacterCollection = [
		{ value: 'borac', image: 'characters/borac.png' },
		{ value: 'bruce', image: 'characters/bruce.png' },
		{ value: 'duke', image: 'characters/duke.png' },
		{ value: 'jack', image: 'characters/jack.png' },
		{ value: 'joe', image: 'characters/joe.png' },
		{ value: 'kate', image: 'characters/kate.png' },
		{ value: 'lara', image: 'characters/lara.png' },
		{ value: 'madone', image: 'characters/madone.png' },
		{ value: 'marina', image: 'characters/marina.png' },
		{ value: 'ostap', image: 'characters/ostap.png' },
		{ value: 'pete', image: 'characters/pete.png' },
		{ value: 'swann', image: 'characters/swann.png' }
	];
	
	data.MoodCollection = MoodCollection;
	data.GagCollection = GagCollection;
	data.ActionCollection = ActionCollection;
	data.AnimationTypeCollection = AnimationTypeCollection;
	data.CharacterCollection = CharacterCollection;
	
})(data);