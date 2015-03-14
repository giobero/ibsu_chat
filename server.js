var WebSocketServer = require('websocket').server;
var http = require('http');
var url = require('url');
var fs = require('fs');

var serverApp = {
	dir: __dirname
};

var appDir = 'app';
var publicDir = 'public'
var publicDirFull = '/' +  appDir + '/' + publicDir;
var extentions = {
	'image/png': /\.png$/,
	'text/css': /\.css$/,
	'text/html; charset=utf-8': /\.html$/,
	'text/javascript': /\.js$/
};

var filesCache = {};
var error404File = null;

/* Chache static content*/
function scanStaticDir (dir) {
	dir = dir || '/';
	fs.readdirSync(serverApp.dir + publicDirFull + dir).forEach(function (subdir) {
		var stat = fs.statSync(serverApp.dir + publicDirFull + dir + subdir);
		if (stat.isDirectory()) {
			scanStaticDir(dir + subdir + '/');
		} else {
			var contentType = 'text/plain',
			plain = fs.readFileSync(serverApp.dir + publicDirFull + dir + subdir, 'binary');
			for (var contentTypeKey in extentions) {
				if (extentions[contentTypeKey].test(subdir)) {
					contentType = contentTypeKey;
					break;
				}
			}
			console.log('/' + publicDir + dir + subdir);
			filesCache['/' + publicDir + dir + subdir] = {
				contentType: contentType,
				plain: plain
			};
		}
	});
};
scanStaticDir();

var server = http.createServer(function(req, res) {
	var pathname = url.parse(req.url).pathname;

	if (pathname == '/') {
		pathname = '/public/html/main.html';
	}
	
	var responseFile = null;
	var responseCode = null;
	if (filesCache[pathname]) {
		responseCode = 200;
		responseFile = filesCache[pathname];
	} else {
		if (!error404File) {
			var plain = fs.readFileSync(serverApp.dir + '/' + appDir + '/views/errors/404.html', 'binary');
			error404File = {
				plain: plain,
				contentType: 'text/html; charset=utf-8'
			}
		}
		responseCode = 404; 
		responseFile = error404File;
	}

	res.statusCode = responseCode;
	res.setHeader('Content-Type', responseFile.contentType);
	res.setHeader('Cache-Control', 'max-age=3600, must-revalidate');
	res.setHeader('Content-Length', responseFile.plain.length);
	res.end(responseFile.plain, 'binary');
});
server.listen(7777, function() { });
console.log('Server started, port: 7777');

// create the web socket server
wsServer = new WebSocketServer({
	httpServer: server
});

/* In this array we store all opened connections. */
var connections = [];

/* Our little utility function for logging server events. */
var log = function(msg) {
	console.log(new Date() + ': ' + msg);
}

/* 
 * Key for this object is connected usernames. Value is true if username
 * still has active connection, false otherwise.
 */
var userNameCache = {};

wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	
	log('Another user connected');
	connections.push(connection);
	var username = null;

	/* Event when client sends message to server. */
	connection.on('message', function(message) {
		if (message.type !== 'utf8') {
			return;
		}
		try {
			var msg = JSON.parse(message.utf8Data);
		} catch(e) {
			return;
		}
		if (!msg.type) {
			return;
		}
		if (msg.type === 'username') {
			username = msg.username;	
			userNameCache[username] = true;
			log('user set username:' + username);
		} else if (msg.type === 'msg') {
			log('messge from: ' + username + '. msg=' + msg.msg);
			for (var i=0,l=connections.length; i<l; i++) {
				connections[i].send(JSON.stringify({
					type: 'msg',
					username: username,
					msg: msg.msg
				}));
			}
		}
	});
	
	/* Event when client closes connection (closes browser tab) */
	connection.on('close', function(connection) {
		log('user quited. (' + username + ')');
		userNameCache[username] = false;
		connections.splice(connections.indexOf(connection), 1);
	});
});

