(function(document) {
    /* Web Socket connection. */
    var conn = null;
    var username = null;
    var chatArea = null;
    var messageField = null;

    var initSocket = function (socketReady) {
        window.WebSocket = window.WebSocket || window.MozWebSocket;

        var socketUrl = (window.location+'').replace('http','ws');
        var connection = new WebSocket(socketUrl);

        connection.onopen = function () {
            /* Expose connection inside module. */
            conn = connection;
            socketReady();
            // console.log('connection is opened');
        };

        connection.onerror = function (error) {
            console.error(error);
        };

        connection.onmessage = function (message) {
            var data = JSON.parse(message.data);


            if(!data.hasOwnProperty("type")){
                return false;
            }

            // if history
            if(data.type == "history"){
                var historyData = data.data;
                for(var i = 0, historyLength = historyData.length; i < historyLength; i++){
                    chatArea.addChild(El('div', historyData[i].username + ': ' + historyData[i].msg));
                }
            }

            // if same username
             if(data.type == "sameUname"){
                alert('This username exists, please choose other username');
                window.location.reload();
                return false;
            }else if(data.type == "msg"){
                chatArea.addChild(El('div',  data.username + ': ' + data.msg));
            }
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
                el.addEventListener(eventName, function(e){return handler(e)}, ob);
                return ob;
            }
        };

        return ob;
    };

    var initDom = function() {

        welcomeBanner = El('h1');

        chatArea = El('div', {
            class: 'chat-area'
        });

        messageField = El('input', {
            type: 'text',
            class: 'message-field',
            autofocus : 'autofocus'
        });

        var messageFieldContainer = El('form').addChild(
                El('label', 'Message: '),
                messageField,
                El('input', {type: 'submit', value: 'Send', 'class' : 'button'}).on('click', function(e) {
                    e.preventDefault();
                    var msg = messageField.el.value;
                    if (!msg || !msg.trim()) {
                        return;
                    }
                    messageField.el.value = '';
                    conn.send(JSON.stringify({type:'msg', msg: msg}));
                })
        );
        welcomeBanner.el.innerHTML = "Hello, " + username;
        document.getElementById("main-wrapper").appendChild(welcomeBanner.el);
        document.getElementById("main-wrapper").appendChild(chatArea.el);
        document.getElementById("main-wrapper").appendChild(messageFieldContainer.el);
    };

    var init = function () {
        initSocket(function() {
            /* Enforse user to enter non-empty username. Otherwise don't let him chat! */
            username = prompt('Choose your username: ');
            // min length 2
            if(username == null || username.trim().length < 2  ){
                alert('You are not allowed to take username length less than 2 ');
                window.location.reload();
                return false;
            }

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
