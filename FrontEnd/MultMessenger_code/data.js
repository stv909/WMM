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
	
	data.MoodCollection = MoodCollection;
	data.GagCollection = GagCollection;
	data.ActionCollection = ActionCollection;
	
})(data);