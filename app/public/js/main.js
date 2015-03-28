(function(document) {
	/* Web Socket connection. */
	var conn = null;
	var username = null;
	var chatArea = null;
	var ajaxArea = null;
	var messageField = null;

	var getAjaxConstructor = function() {
		if (window.XMLHttpRequest)  {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			return XMLHttpRequest;
		} else {
			// code for IE6, IE5
			return ActiveXObject('Microsoft.XMLHTTP');
		}
	}
	
	var getUsers = function(async) {
		var xmlhttp = new (getAjaxConstructor());
		var async = async || false;
		xmlhttp.open('GET', 'getUsers?rnd='+Math.random(), async);
		if (!async) {
			xmlhttp.send();
			console.log(xmlhttp);
			ajaxArea.addChild(El('pre', xmlhttp.responseText+''));
		} else {
			xmlhttp.onreadystatechange=function() {
				if (xmlhttp.readyState==4 && xmlhttp.status==200) {
					console.log(xmlhttp);
					ajaxArea.addChild(El('pre', xmlhttp.responseText+''));
				}
			}
			xmlhttp.send();
		}
	};

	var initSocket = function (socketReady) {
		window.WebSocket = window.WebSocket || window.MozWebSocket;

		var socketUrl = (window.location+'').replace('http','ws');
		var connection = new WebSocket(socketUrl);

		connection.onopen = function () {
			/* Expose connection inside module. */
			conn = connection;
			socketReady();
			console.log('connection is opened');
		};

		connection.onerror = function (error) {
			console.error(error);
		};

		connection.onmessage = function (message) {
			var data = JSON.parse(message.data);
			chatArea.addChild(El('div', data.username + ': ' + data.msg));
		};
	};

	var El = function (tag, innerHtml, attrs) {
		
		var log = attrs && attrs.type=='button'; 
		if (log)  {
			console.log(attrs);
			console.log(innerHtml);
			console.log(typeof innerHtml);
		}
		(typeof innerHtml === 'object') && (attrs = innerHtml);
		attrs = attrs || {};
	
		if (log) {
			console.log('after');
			console.log(attrs);
		}

		var el = document.createElement(tag);
		typeof innerHtml === 'string' && (el.innerHTML = innerHtml);

		for (var attr in attrs) {
			if (!attrs.hasOwnProperty(attr)) {
				continue;
			}
			el.setAttribute(attr, attrs[attr]);
		}
		
		var ob = {
			el: el,
			addChild: function(children) {
				var arr = children instanceof Array ? children : arguments;
				for (var i=0, l=arr.length; i<l; i++) {
					el.appendChild(arr[i].el);
				}
				return ob;
			},
			on: function (eventName, handler) {
				el.addEventListener(eventName, handler, ob);	
				return ob;
			}
		};

		return ob;
	};
	
	var initDom = function() {
		chatArea = El('div', {
			class: 'chat-area',
			style: 'height:50%; overflow:scroll;'
		});

		ajaxArea = El('div', {
			style: 'overflow:scroll;'
		});

		messageField = El('input', {
			type: 'text',
			class: 'message-field'
		});
		
		var messageSendButton = El('input', {type: 'button', value: 'Send'}).on('click', function() {
			var msg = messageField.el.value;
			if (!msg) {
				return;
			}
			messageField.el.value = '';
			conn.send(JSON.stringify({type:'msg', msg: msg}));
		});

		var getUsersButton = El('input', {type: 'button', value: 'GetUsers'}).on('click', function() {
			getUsers(true);	
		});

		var getUsersSyncButton = El('input', {type: 'button', value: 'GetUsersSync'}).on('click', function() {
			getUsers(false);	
		});

		var messageFieldContainer = El('div').addChild(
				El('label', 'Message: '),
				messageField,
				messageSendButton,
				getUsersButton,
				getUsersSyncButton
		);

		document.body.appendChild(chatArea.el);
		document.body.appendChild(messageFieldContainer.el);
		document.body.appendChild(ajaxArea.el);
	};

	var init = function () {
		initSocket(function() {
			/* Enforse user to enter non-empty username. Otherwise don't let him chat! */
			username = prompt('Choose your username: ');
			conn.send(JSON.stringify({
				type: 'username',
				username: username
			}));
			initDom();
		});
	};

	window.Chat = {
		init: init
	};
})(document);

window.onload = Chat.init;
