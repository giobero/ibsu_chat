(function(document) {
	/* Web Socket connection. */
	var conn = null;
	var username = null;
	var chatArea = null;
	var messageField = null;
	

	var initSocket = function (socketReady) {
		window.WebSocket = window.WebSocket || window.MozWebSocket;

		var connection = new WebSocket('ws://127.0.0.1:8080');

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
			style: 'height:80%;'
		});

		messageField = El('input', {
			type: 'text',
			class: 'message-field'
		});
		
		var messageFieldContainer = El('div').addChild(
				El('label', 'Message: '),
				messageField,
				El('input', {type: 'button', value: 'Send'}).on('click', function() {
					var msg = messageField.el.value;
					if (!msg) {
						return;
					}
					messageField.el.value = '';
					conn.send(JSON.stringify({type:'msg', msg: msg}));
				})
		);

		document.body.appendChild(chatArea.el);
		document.body.appendChild(messageFieldContainer.el);
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
