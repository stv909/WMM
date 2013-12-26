var uuid = new Uuid();
var base64 = new Base64();

var wsock;
var onNow;
var profile;
var profileDatas;
var newMessagesInfo;

function initProfileData()
{
	wsock = null;
	onNow = null;
	profile = {
		messages: {},
		refreshAccountIds: {},
		refreshMessageIds: {},
		initRequestNeeded: true
	};
	profileDatas = {};
	
	newMessagesInfo = {
		perContactCount: {},
		ids: {}
	};
}
initProfileData();

function newMessagesTotalCount()
{
	return Object.keys(newMessagesInfo.ids).length;	
}

function updateNewMessagePerContactCount(messageId, messageContent, increment)
{
	if (messageContent)
	{
		if (increment > 0)
		{
			if (newMessagesInfo.perContactCount[messageContent.from] === undefined)
			{
				newMessagesInfo.perContactCount[messageContent.from] = increment;
			}
			else
			{
				newMessagesInfo.perContactCount[messageContent.from] += increment;
			}
			return;
		}
		else if (increment < 0)
		{
			var currentValue = newMessagesInfo.perContactCount[messageContent.from];
			if (currentValue !== undefined)
			{
				var newValue = currentValue + increment;
				if (newValue < 0)
				{
					console.warn('new message counter is less then zero: ' + messageId);
					newValue = 0;
				}
				(newValue === 0)
					? delete newMessagesInfo.perContactCount[messageContent.from]
					: newMessagesInfo.perContactCount[messageContent.from] = newValue;
				return;
			}
		}
	}
	console.warn('incorrect input, failed to update new message counter: ' + messageId + ' (' + increment + ')');
}

function createContactItem(accountId)
{
	var profileData = profileDatas[accountId];
	var screenname = (profileData && profileData.nickname && profileData.nickname !== '')
		? profileData.nickname
		: accountId;
	var avatarurl = (profileData && profileData.avatar && profileData.avatar !== '')
		? profileData.avatar
		: 'Resources/defaultAvatar.png';
	var item = document.createElement('div');
	item.id = 'contact-' + accountId; 
	item.innerHTML = 
		'<img id="contactAvatar-' + accountId + '" src="' + avatarurl + '" style="width: 25px; height: 25px; margin-right: 8px;">' +
		'<span id="contactName-' + accountId + '">' + screenname + '</span>' +
		'<span id="contactCounter-' + accountId + '" style="font-weight: bold; color: green; margin-left: 8px;"></span>';
	item.title = accountId;
	item.accountId = accountId;
	item.className = 'contactitem';
	item.style.opacity = accountId in profile.online ? '1.0' : '0.5';
	item.style.width = '100%;';
	item.style.cursor = 'pointer';
	item.style.padding = '4px';
	
	item.onclick = function()
	{
		if (this.accountId === profile.friendId)
			return;
		if (profile.friendId)
		{
			var priorFriend = document.getElementById('contact-' + profile.friendId);
			priorFriend && (priorFriend.style.border = '');
		}
		profile.friendId = this.accountId;
		var newFriend = document.getElementById('contact-' + profile.friendId);
		newFriend && (newFriend.style.border = '1px solid black');
		var nickname = profileDatas[profile.friendId] && profileDatas[profile.friendId].nickname !== ''
			? profileDatas[profile.friendId].nickname
			: profile.friendId;
		document.getElementById('friendName').innerHTML = nickname;
		document.getElementById('friendName').title = profile.friendId;
		applyFriendTapeFilter();
		autoscrollTape();
	};
	return item;
}

function fillContacts()
{
	// TODO: make it async and on demand
	
	var contacts = document.getElementById('contacts');
	contacts.innerHTML = '';
	for (var accountId in profile.users)
	{
		if (accountId === profile.accountId)
			continue;
		contacts.appendChild(createContactItem(accountId));
	}
}

function requestProfileDatas()
{
	var profileDataIds = '';
	for (var userId in profile.users)
	{
		profileDataIds += 'profile.' + userId + ',';
	}
	(profileDataIds.length > 0) && (profileDataIds = profileDataIds.substring(0, profileDataIds.length - 1));
	wsock.send('retrieve');
	wsock.send(profileDataIds);
}

function refreshContactItem(accountId)
{
	if (accountId === profile.accountId)
		return;
	var contactItem = document.getElementById('contact-' + accountId);
	if (!contactItem)
	{
		var contacts = document.getElementById('contacts');
		contactItem = createContactItem(accountId);
		contacts.appendChild(contactItem);
	}
	else
	{
		var profileData = profileDatas[accountId];
		var screenname = (profileData && profileData.nickname && profileData.nickname !== '')
			? profileData.nickname
			: accountId;
		var avatarurl = (profileData && profileData.avatar && profileData.avatar !== '')
			? profileData.avatar
			: 'Resources/defaultAvatar.png';
		document.getElementById('contactAvatar-' + accountId).src = avatarurl;
		document.getElementById('contactName-' + accountId).innerHTML = screenname;
		contactItem.style.opacity = accountId in profile.online ? '1.0' : '0.5';
	}
}

function refreshContactItemNewMessages(accountId)
{
	if (accountId === profile.accountId)
		return;
	var contactElem = document.getElementById('contactCounter-' + accountId);
	if (contactElem)
	{
		var count = newMessagesInfo.perContactCount[accountId];
		if (!count)
		{
			count = 0;
		}
		contactElem.innerHTML = count > 0 
			? '+' + count
			: '';
	}
}
	
function refreshContacts()
{
	// TODO: make it async and on demand
	
	for (var accountId in profile.refreshAccountIds)
	{
		refreshContactItem(accountId);
	}
}

function convertTimestamp(timestamp, part)
{
	function getTwoDigitString(n)
	{
		return n < 10 ? '0' + n : n;
	}
	var d = new Date(timestamp);
	var year = d.getFullYear();
	var month = getTwoDigitString(d.getMonth() + 1);
	var date = getTwoDigitString(d.getDate());
	var hours = getTwoDigitString(d.getHours());
	var minutes = getTwoDigitString(d.getMinutes());
	var seconds = getTwoDigitString(d.getSeconds());
	var datetimeString = year + '.' + month + '.' + date + ' ' + hours + ':' + minutes + ':' + seconds;
	if (part === 'time')
	{
		datetimeString = hours + ':' + minutes + ':' + seconds;
	}
	else if (part === 'date')
	{
		datetimeString = year + '.' + month + '.' + date;
	}
	else if (part === 'longdate' || part === 'full')
	{
		var monthRusName = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
		datetimeString = date + ' ' + monthRusName[d.getMonth()] + ' ' + year;
		if (part === 'full')
		{
			datetimeString += '<br>' + hours + ':' + minutes + ':' + seconds;
		}
	}
	return datetimeString;
}

function getShareUrl(recordIds)
{
	var requestIds = '';
	for (var i = 0; i < recordIds.length; ++i)
	{
		requestIds += 'msg.' + recordIds[i] + ',';
	}
	(requestIds.length > 0) && (requestIds = requestIds.substring(0, requestIds.length - 1));
	return shareUrl + '?ids=' + requestIds;
}

function setMessageProfileRelatedStuff(accountId, nameElem, avatarElem)
{
	var profileData = {
		avatar: 'Resources/defaultAvatar.png',
		nickname: accountId,
		sex: ''
	};
	var profileDataSource = profileDatas[accountId];
	if (profileDataSource)
	{
		if (profileDataSource.avatar && profileDataSource.avatar !== '')
		{
			profileData.avatar = profileDataSource.avatar;
		}
		if (profileDataSource.nickname && profileDataSource.nickname !== '')
		{
			profileData.nickname = profileDataSource.nickname;
		}
		if (profileDataSource.sex && profileDataSource.sex !== '')
		{
			profileData.sex = profileDataSource.sex;
		}
	}
	nameElem.innerHTML = profileData.nickname;
	avatarElem.src = profileData.avatar;
}

function setMessageShown(messageId, stampElem)
{
	stampElem.style.backgroundColor = messageId in newMessagesInfo.ids 
		? 'yellow'
		: 'whitesmoke';
}

function pushMessage(messageId, messageContent)
{
	function onShownMouseOver()
	{
		if (this.msgId in newMessagesInfo.ids)
		{
			wsock.send('shown');
			wsock.send('msg.' + this.msgId);
		}
	}
	function onCloneClick()
	{
		var editValue = this.ownerElem.contentElem.innerHTML;
		var inputBlock = document.getElementById('inputBlock');
		inputBlock.innerHTML = editValue;
		var inputCode = document.getElementById('inputCode');
		inputCode.value = editValue;
	}
	function onEditClick()
	{
		alert('not implemented yet');
	}
	function onShareClick()
	{
		prompt('Url to share: ', getShareUrl([this.ownerElem.msgId]));
	}
	function onDeleteClick()
	{
		alert('not implemented yet');
	}
	function onHideClick()
	{
		alert('not implemented yet');
	}
	
	profile.messages[messageId] = messageContent;
	if (messageId in newMessagesInfo.ids)
	{
		updateNewMessagePerContactCount(messageId, messageContent, 1);
	}

	var isIncomeMsg = messageContent.to === profile.accountId;
	var item = document.createElement('table');
	item.style.borderBottom = '1px solid silver';
	item.style.width = '100%';
	item.msgId = messageId;
	item.msgFrom = messageContent.from;
	item.msgTo = messageContent.to;
	item.onmouseover = onShownMouseOver;
	
	var itemRow = document.createElement('tr');
	item.appendChild(itemRow);
	var itemSender = document.createElement('td');
	itemSender.style.verticalAlign = 'top';
	itemSender.style.textAlign = 'center';
	itemSender.style.borderRight = '1px solid silver';
	itemSender.style.backgroundColor = 'whitesmoke';
	itemSender.style.width = '128px';
	var itemContent = document.createElement('td');
	itemContent.style.width = '1024px';
	itemContent.style.overflowX = 'hidden';
	var itemStamp = document.createElement('td');
	itemStamp.id = 'senderstamp-' + messageId;
	itemStamp.style.verticalAlign = 'top';
	itemStamp.style.textAlign = 'center';
	itemStamp.style.borderLeft = '1px solid silver';
	itemStamp.style.width = '128px';
	itemRow.appendChild(itemSender);
	itemRow.appendChild(itemContent);
	itemRow.appendChild(itemStamp);

	var sendername = document.createElement('div');
	sendername.id = 'sendername-' + messageId;
	itemSender.appendChild(sendername);
	
	var senderavatar = document.createElement('img');
	senderavatar.id = 'senderavatar-' + messageId;
	senderavatar.style.width = '50px';
	senderavatar.style.height = '50px';
	itemSender.appendChild(senderavatar);
	
	setMessageProfileRelatedStuff(messageContent.from, sendername, senderavatar);
	setMessageShown(messageId, itemStamp);
	sendername.style.color = isIncomeMsg
		? 'blue'
		: 'gray';

	var stamptext = document.createElement('div');
	stamptext.innerHTML = convertTimestamp(messageContent.timestamp);
	stamptext.style.color = 'gray';
	itemStamp.appendChild(stamptext);

	var clonebutton = document.createElement('button');
	clonebutton.innerHTML = 'clone';
	clonebutton.style.color = 'gray';
	clonebutton.style.width = '100%';
	clonebutton.ownerElem = item;
	clonebutton.onclick = onCloneClick;
	itemStamp.appendChild(clonebutton);

	var editbutton = document.createElement('button');
	editbutton.innerHTML = 'edit';
	editbutton.style.color = 'gray';
	editbutton.style.width = '100%';
	editbutton.ownerElem = item;
	editbutton.onclick = onEditClick;
	itemStamp.appendChild(editbutton);

	var sharebutton = document.createElement('button');
	sharebutton.innerHTML = 'share';
	sharebutton.style.color = 'gray';
	sharebutton.style.width = '100%';
	sharebutton.ownerElem = item;
	sharebutton.onclick = onShareClick;
	itemStamp.appendChild(sharebutton);

	if (isIncomeMsg)
	{
		var hidebutton = document.createElement('button');
		hidebutton.innerHTML = 'hide';
		hidebutton.style.color = 'gray';
		hidebutton.style.width = '100%';
		hidebutton.ownerElem = item;
		hidebutton.onclick = onHideClick;
		itemStamp.appendChild(hidebutton);
	}
	else
	{
		var deletebutton = document.createElement('button');
		deletebutton.innerHTML = 'delete';
		deletebutton.style.color = 'gray';
		deletebutton.style.width = '100%';
		deletebutton.ownerElem = item;
		deletebutton.onclick = onDeleteClick;
		itemStamp.appendChild(deletebutton);
	}

	var content = document.createElement('div');
	content.style.pointerEvents = 'none'; // HINT: remove this line to make message interactive
	content.innerHTML = messageContent.content;
	itemContent.appendChild(content);
	item.contentElem = content;
	document.getElementById('tape').appendChild(item);
	item.style.display = isMessageInsideOfTape(item)
		? 'table'
		: 'none';
}

function refreshTape()
{
	for (var i = 0; i < profile.tape.length; ++i)
	{
		var messageId = profile.tape[i].id.split('.')[1];
		var messageData = profile.messages[messageId];
		if (messageData.from in profile.refreshAccountIds)
		{
			setMessageProfileRelatedStuff(
				messageData.from, 
				document.getElementById('sendername-' + messageId), 
				document.getElementById('senderavatar-' + messageId)
			);
		}
	}
}

function refreshTapeNewMessages()
{
	for (var messageId in profile.refreshMessageIds)
	{
		setMessageShown(messageId, document.getElementById('senderstamp-' + messageId));
	}
}

function pushNewMessage(message, income)
{
	var messageId = message.id.split('.')[1];
	var messageContent = decodeMessage(message.body);
	if (income)
	{
		newMessagesInfo.ids[messageId] = true;
	}
	pushMessage(messageId, messageContent);
	if (income)
	{
		handleMessageShownChanged([messageId]);
	}
	autoscrollTape();
}

function fillTape()
{
	// TODO: make it async and on demand
	
	var messageIds = '';
	for (var i = 0; i < profile.tape.length; ++i)
	{
		messageIds += profile.tape[i].id + ',';
	}
	(messageIds.length > 0) && (messageIds = messageIds.substring(0, messageIds.length - 1));
	wsock.send('retrieve');
	wsock.send(messageIds);
}

function fillNewMessages()
{
	for (var i = 0; i < profile.tape.length; ++i)
	{
		var messageId = profile.tape[i].id.split('.')[1];
		if (!profile.tape[i].shown)
		{
			newMessagesInfo.ids[messageId] = true;
		}
	}
}

function isMessageInsideOfTape(item)
{
	return item.msgFrom === profile.friendId || item.msgTo === profile.friendId;
}

function applyFriendTapeFilter()
{
	var item = document.getElementById('tape').firstChild;
	while (item)
	{
		if (item.nodeName === 'TABLE')
		{
			item.style.display = isMessageInsideOfTape(item)
				? 'table'
				: 'none';
		}
		item = item.nextSibling; 
	}
	document.getElementById('inputPanel').style.display = 'table';
}

function doLogin(accountId)
{
	function onOpen(e)
	{
		wsock.send('login');
		wsock.send(accountId);
	}
	function onError(e)
	{
		console.error('web socket server error:');
		console.info(e);
		state.loginFailed(accountId);
	}
	function onClose(e)
	{
		state.logoutDone(accountId);
	}
	function onMessage(e)
	{
		function onLoginComplete()
		{
			wsock.send('broadcast');
			wsock.send('online.' + accountId);
			requestProfileDatas();
		}
		function onLoginProgress()
		{
			if (
				profile.accountId === undefined || 
				profile.users === undefined || 
				profile.tape === undefined ||
				profile.online === undefined
			)
				return;
			onLoginComplete();
		}
		
		var retrieveDatas = {
			'msg': {},
			'profile': {}
		};
		var retrieveHandlers = {
			'msg': function(msgId, msgValue)
			{
				if (msgValue)
				{
					retrieveDatas.msg[msgId] = msgValue;
				}
				else
				{
					console.warn('Message data not found for id: ' + msgId);
				}
			},
			'profile': function(accountId, profileValue)
			{
				if (profileValue)
				{
					retrieveDatas.profile[accountId] = profileValue;
					
				}
				else
				{
					console.warn('Profile data not found for id: ' + accountId);
				}
			}
		};
		var retrieveCompletes = {
			'msg': function()
			{
				var mid;
				var msgList = [];
				for (mid in retrieveDatas.msg)
				{
					var content = retrieveDatas.msg[mid];
					msgList.push(content.timestamp + ' ' + mid);
				}
				msgList = msgList.sort();
				for (var l = 0; l < msgList.length; ++l)
				{
					mid = msgList[l].split(' ')[1];
					pushMessage(mid, decodeMessage(retrieveDatas.msg[mid]));
				}
				retrieveDatas.msg = {};

				var refreshContactsIds = {};
				for (var accountId in newMessagesInfo.perContactCount)
				{
					refreshContactsIds[accountId] = true;
				}
				refreshContactsNewMessages(refreshContactsIds);
			},
			'profile': function()
			{
				for (var profileId in retrieveDatas.profile)
				{
					profileDatas[profileId] = retrieveDatas.profile[profileId];
				}
				if (profile.accountId in retrieveDatas.profile)
				{
					dataToProfilePanel(profileDatas[profile.accountId]);
				}
				if (profile.initRequestNeeded)
				{
					profile.initRequestNeeded = false;
					fillNewMessages();
					refreshTotalNewMessages();
					fillContacts();
					fillTape();
					state.loginDone(accountId);
				}
			}
		};
		
		var response, i, parts, contactId;
		try
		{
			response = JSON.parse(e.data);
		}
		catch(ex)
		{
			console.error('Failed parse wsock output; Name: ' + ex.name + '; Desc: ' + ex.message);
			return;
		}
		var callback;
		if (response.login)
		{
			profile.accountId = accountId;
			state.loginProgress(accountId);
			wsock.send('users');
			wsock.send('tape');
			wsock.send('online');
		}
		else if (response.users)
		{
			profile.users = arrayToDictionary(response.users);
			onLoginProgress();
		}
		else if (response.tape)
		{
			profile.tape = response.tape;
			onLoginProgress();
		}
		else if (response.online)
		{
			profile.online = arrayToDictionary(response.online);
			onLoginProgress();
		}
		else if (response.send)
		{
			pushNewMessage(response.send, true);
			document.getElementById('audioNewMessage').play();
		}
		else if (response.sent)
		{
			pushNewMessage(response.sent, false);
			onClear();
			inputWaitState(response.sent.id, false);
		}
		else if (response.broadcast)
		{
			contactId = response.broadcast.id.split('.')[1];
			if (contactId)
			{
				if (
					response.broadcast.id.indexOf('online.') === 0 ||
					response.broadcast.id.indexOf('offline.') === 0
				)
				{
					wsock.send('status');
					wsock.send(contactId);
				}
				else if (response.broadcast.id.indexOf('profile.') === 0)
				{
					handleContactProfileChanged(contactId, response.broadcast.body);
				}
			}
		}
		else if (response.now)
		{
			if (onNow)
			{
				callback = onNow;
				onNow = null;
				callback(response.now);
			}
		}
		else if (response.retrieve)
		{
			var recordTypes = {};
			for (i = 0; i < response.retrieve.length; ++i)
			{
				parts = response.retrieve[i].id.split('.');
				if (parts.length === 2)
				{
					recordTypes[parts[0]] = true;
					retrieveHandlers[parts[0]] && retrieveHandlers[parts[0]](parts[1], response.retrieve[i].value);
				}
				else
				{
					console.warn('have no handler for retireved record: ' + response.retrieve[i].id);
				}
			}
			for (var recordType in recordTypes)
			{
				retrieveCompletes[recordType] && retrieveCompletes[recordType]();
			}
		}
		else if (response.shown)
		{
			var shownIds = [];
			for (i = 0; i < response.shown.length; ++i)
			{
				parts = response.shown[i].id.split('.');
				var messageId = parts[1];
				if (messageId in newMessagesInfo.ids) 
				{
					delete newMessagesInfo.ids[messageId];
					updateNewMessagePerContactCount(messageId, profile.messages[messageId], -1);
				}
				shownIds.push(messageId);
			}
			(shownIds.length > 0) && handleMessageShownChanged(shownIds);
		}
		else if (response.status && profile.users && profile.online)
		{
			for (i = 0; i < response.status.length; ++i)
			{
				if (!response.status[i].registered)
					continue; // TODO: implement correct not registered handling
				contactId = response.status[i].id;
				var contactIsOnline = response.status[i].online;
				profile.users[contactId] = true;				
				if (contactId in profile.online && !contactIsOnline)
				{
					delete profile.online[contactId];
				}
				else if (!(contactId in profile.online) && contactIsOnline)
				{
					profile.online[contactId] = true;
				}
				refreshContactItem(contactId);
			}
		}
	}

	state.connectProgress();
	localStorage.cachedAccountId = accountId;
	wsock = new WebSocket(wsockServerUrl);
	wsock.onopen = onOpen;
	wsock.onerror = onError;
	wsock.onclose = onClose;
	wsock.onmessage = onMessage;
	
	window.onbeforeunload = function()
	{
		if (!wsock)
			return;
		doLogout();
	};
}

function doLogout()
{
	if (!wsock)
	{
		console.warn('can not logout without login');
		return;
	}
	wsock.send('broadcast');
	wsock.send('offline.' + profile.accountId);
	wsock.close();
	initProfileData();	
	document.getElementById('tape').innerHTML = '';
	document.getElementById('contacts').innerHTML = '';
	document.getElementById('friendName').innerHTML = '';
	onClear();
}

function editProfile()
{
	window.open('#editProfile', '_self');
}

function onProfileAvatarPreview()
{
	document.getElementById('profileAvatarPreview').src = document.getElementById('profileAvatarInput').value;
}

function onProfileChanged()
{
	wsock.send('store');
	wsock.send('profile.' + profile.accountId);
	wsock.send(JSON.stringify(dataFromProfilePanel()));
	wsock.send('broadcast');
	wsock.send('profile.' + profile.accountId);
}

function refreshContactProfilesRelatedStuff()
{
	if (profile.accountId in profile.refreshAccountIds)
	{
		dataToProfilePanel(profileDatas[profile.accountId]);
	}
	if (profile.friendId in profile.refreshAccountIds)
	{
		var nickname = profileDatas[profile.friendId] && profileDatas[profile.friendId].nickname !== ''
			? profileDatas[profile.friendId].nickname
			: profile.friendId;
		document.getElementById('friendName').innerHTML = nickname;
	}
	refreshTape();
	refreshContacts();
	profile.refreshAccountIds = {};
}

function handleContactProfileChanged(accountId, accountData)
{
	profile.refreshAccountIds[accountId] = true;
	if (accountData)
	{
		profileDatas[accountId] = accountData;
	}
	refreshContactProfilesRelatedStuff();
}

function refreshMessagesRelatedStuff()
{
	refreshTapeNewMessages();
	
	var refreshContactsIds = {};
	for (var messageId in profile.refreshMessageIds)
	{
		var messageData = profile.messages[messageId];
		messageData && (refreshContactsIds[messageData.from] = true);
	}
	refreshContactsNewMessages(refreshContactsIds);
	refreshTotalNewMessages();
	profile.refreshMessageIds = {};
}

function handleMessageShownChanged(messageIds)
{
	for (var i = 0; i < messageIds.length; ++i)
	{
		profile.refreshMessageIds[messageIds[i]] = true;
	}
	refreshMessagesRelatedStuff();
}

function refreshTotalNewMessages()
{
	var totalCount = newMessagesTotalCount();
	if (totalCount > 0)
	{
		document.getElementById('totalCounter').innerHTML = '+' + totalCount;
		document.getElementById('totalMarkShown').style.display = 'inline';
	}
	else
	{
		document.getElementById('totalCounter').innerHTML = '';
		document.getElementById('totalMarkShown').style.display = 'none';
	}
}

function refreshContactsNewMessages(refreshContactsIds)
{
	for (var accountId in refreshContactsIds)
	{
		refreshContactItemNewMessages(accountId);
	}
}

function dataFromProfilePanel()
{
	var sexElem = document.querySelector('input[name="profileSexInput"]:checked');
	return {
		avatar: document.getElementById('profileAvatarInput').value, 
		nickname: document.getElementById('profileNickInput').value, 
		sex: sexElem ? sexElem.value : ''
	};
}

function dataToProfilePanel(profileData)
{
	if (!profileData)
	{
		profileData = {
			avatar: '',
			nickname: '',
			sex: ''
		};
	}
	// TODO: fill radios more accurataly - via group name and value
	if (profileData.sex === 'male')
	{
		document.getElementById('profileSexInputM').checked = true;
	}
	else if (profileData.sex === 'female')
	{
		document.getElementById('profileSexInputF').checked = true;
	}
	else
	{
		document.getElementById('profileSexInputM').checked = false;
		document.getElementById('profileSexInputF').checked = false;
	}
	document.getElementById('profileAvatarInput').value = profileData.avatar;
	document.getElementById('userAvatar').src = profileData.avatar;
	document.getElementById('profileNickInput').value = profileData.nickname;
	document.getElementById('userLogin').innerHTML = profileData.nickname;
	onProfileAvatarPreview();
}

function encodeMessage(msg)
{
	msg.content = base64.encode(msg.content);
	return JSON.stringify(msg);
}

function decodeMessage(msg)
{
	msg.content = base64.decode(msg.content);
	return msg;
}

function doSend(messageId, fromId, toId, timestamp, messageContent)
{
	inputWaitState('msg.' + messageId, true);
	wsock.send('store');
	wsock.send('msg.' + messageId);
	wsock.send(
		encodeMessage(
			{
				id: messageId,
				from: fromId, 
				to: toId, 
				timestamp: timestamp,
				content: messageContent
			}
		)
	);
	wsock.send('send');
	wsock.send('msg.' + messageId);
	wsock.send(toId);
}

function onSendBlock()
{
	var input = document.getElementById('inputBlock');
	if (
		!profile.accountId ||
		!profile.friendId ||
		input.innerHTML === ''
	)
		return;
	onNow = function(timestamp)
	{
		doSend(uuid.generate(), profile.accountId, profile.friendId, timestamp, input.innerHTML);
	};
	wsock.send('now');
}

function onSendCode()
{
	var input = document.getElementById('inputCode');
	if (
		!profile.accountId ||
		!profile.friendId ||
		input.value === ''
	)
		return;
	onNow = function(timestamp)
	{
		doSend(uuid.generate(), profile.accountId, profile.friendId, timestamp, input.value);
	};
	wsock.send('now');
}

function onSendBlockKeypress(e)
{
	if (e.ctrlKey && e.keyCode == 10)
	{
		onSendBlock();
		event.preventDefault();
	}
}

function onSendCodeKeypress(e)
{
	if (e.ctrlKey && e.keyCode == 10)
	{
		onSendCode();
		event.preventDefault();
	}
}

function onClear()
{
	var inputBlock = document.getElementById('inputBlock');
	inputBlock.innerHTML = '';
	var inputCode = document.getElementById('inputCode');
	inputCode.value = '';
}

function onMarkAllShown()
{
	var shownList = '';
	for (var messageId in newMessagesInfo.ids)
	{
		shownList += 'msg.' + messageId + ',';
	}
	if (shownList.length > 0)
	{
		shownList = shownList.substring(0, shownList.length - 1);
		wsock.send('shown');
		wsock.send(shownList);
	}
}

function onInputBlockSelect()
{
	var inputBlock = document.getElementById('inputBlock');
	var inputCode = document.getElementById('inputCode');
	inputBlock.style.display = 'block';
	inputBlock.innerHTML = inputCode.value;
	document.getElementById('send').onclick = onSendBlock;
	inputCode.style.display = 'none';
}

function onInputCodeSelect()
{
	var inputBlock = document.getElementById('inputBlock');
	var inputCode = document.getElementById('inputCode');
	inputCode.style.display = 'block';
	inputCode.value = inputBlock.innerHTML;
	document.getElementById('send').onclick = onSendCode;
	inputBlock.style.display = 'none';
}

function autoscrollTape()
{
	var tape = document.getElementById('tape');
	tape.scrollTop = tape.scrollHeight;	
}

function clearAutologin()
{
	localStorage.removeItem('cachedAccountId');
}

var waitingForMessageId;
function inputWaitState(msgId, on)
{
	var input = document.getElementById('inputBlock');
	var send = document.getElementById('send');
	var clear = document.getElementById('clear');
	if (on)
	{
		if (waitingForMessageId)
		{
			console.warn('input waiter already has a target');
		}
		waitingForMessageId = msgId;
		input.contenteditable = false;
		input.style.opacity = '0.5';
		send.disabled = true;
		clear.disabled = true;
	}
	else if (waitingForMessageId === msgId)
	{
		input.contenteditable = true;
		input.style.opacity = '1.0';
		send.disabled = false;
		clear.disabled = false;
		waitingForMessageId = undefined;
	}
}

function onLoginClick()
{
	var login = document.getElementById('loginInput').value;
	if (login && login.length > 0)
	{
		doLogin(login);
	}
}

function StateUI()
{
	this.pageLoaded = function(accountId)
	{
		document.getElementById('loginInput').value = accountId;
		document.getElementById('stateblockLoadingPage').style.display = 'none';
		document.getElementById('stateblockBeforeLogin').style.display = 'inline';
	};
	this.connectProgress = function()
	{
		document.getElementById('stateblockBeforeLogin').style.display = 'none';
		document.getElementById('stateblockProcessConnect').style.display = 'inline';
	};
	this.loginProgress = function(accountId)
	{
		document.getElementById('userLoging').innerHTML = accountId;
		document.getElementById('stateblockProcessConnect').style.display = 'none';
		document.getElementById('stateblockProcessLogin').style.display = 'inline';
	};
	this.loginFailed = function(accountId)
	{
		document.getElementById('loginFailedReport').innerHTML =
			'Login as ' + accountId + 'failed.';
		document.getElementById('stateblockProcessConnect').style.display = 'none';
		document.getElementById('stateblockProcessLogin').style.display = 'none';
		document.getElementById('stateblockBeforeLogin').style.display = 'inline';
	};
	this.loginDone = function(accountId)
	{
		var avatar = profileDatas[accountId] && profileDatas[accountId].avatar !== ''
			? profileDatas[accountId].avatar
			: 'Resources/defaultAvatar.png';
		var nickname = profileDatas[accountId] && profileDatas[accountId].nickname !== ''
			? profileDatas[accountId].nickname
			: accountId;
		document.getElementById('userAvatar').src = avatar;
		document.getElementById('userLogin').innerHTML = nickname;
		document.getElementById('userProfile').title = accountId;
		document.getElementById('stateblockProcessLogin').style.display = 'none';
		document.getElementById('stateblockAfterLogin').style.display = 'inline';
	};
	this.logoutDone = function(accountId)
	{
		document.getElementById('loginFailedReport').innerHTML = 
			'User ' + accountId + ' logged out.';
		document.getElementById('stateblockAfterLogin').style.display = 'none';
		document.getElementById('stateblockBeforeLogin').style.display = 'inline';
	};
}
var state = new StateUI();

function onLoad()
{
	state.pageLoaded(localStorage.cachedAccountId ? localStorage.cachedAccountId : '');
}