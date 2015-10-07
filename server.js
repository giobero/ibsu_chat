/**
 * This file creates NodeJs server for http requests and for socket connections. 
 * Is written for learning purposes for IBSU students.
 */ 


/* Class for socket server. */
var WebSocketServer = require('websocket').server;
/* NodeJs native library to create http server. */
var http = require('http');
/* NodeJs native library easily parse data from request's url. */
var url = require('url');
/* NodeJs native library to work with OS file system. */
var fs = require('fs');

/* Object to cache some info about our server. */
var serverApp = {
	dir: __dirname
};

/* Where is located our application that contains web-content. */
var appDir = 'app';
/* Directory inside application where is located public content of application. */
var publicDir = 'public';
/* Just full path till application's public directory */
var publicDirFull = '/' +  appDir + '/' + publicDir;


/* Content-Type Mapping to their file extention. */ 
var extentions = {
	'image/png': /\.png$/,
	'text/css': /\.css$/,
	'text/html; charset=utf-8': /\.html$/,
	'text/javascript': /\.js$/
};

/* 
 * Object for caching public & static content like css, html, js, images and so on... 
 */
var filesCache = {};
/* 404 (Not Found) error html file will be cached here */
var error404File = null;

/** 
 * Function that caches static content of application 
 */
function scanStaticDir (dir) {
	dir = dir || '/';
	/* 
	 * Synchroniously iterating through files & folders of public directory. 
	 * Read and cache via augmenting file info to <b>fileCache</b> object.
	 */
	fs.readdirSync(serverApp.dir + publicDirFull + dir).forEach(function (subdir) {
		var stat = fs.statSync(serverApp.dir + publicDirFull + dir + subdir);
		if (stat.isDirectory()) {
			/* If another file is directory with recursive call we cache it too. */
			scanStaticDir(dir + subdir + '/');
			return;
		} 

		/* Read content of file from HDD. */
		var plain = fs.readFileSync(serverApp.dir + publicDirFull + dir + subdir, 'binary');

		/* 
		 * Loop on each Content Types and check which extention matches to 
		 * file we are iterating on.
		 */
		var contentType = 'text/plain';
		for (var contentTypeKey in extentions) {
			if (extentions[contentTypeKey].test(subdir)) {
				contentType = contentTypeKey;
				break;
			}
		}
		/* Augment file object to cache object. Key will be relative path of file. */
		filesCache['/' + publicDir + dir + subdir] = {
			contentType: contentType,
			plain: plain
		};
	});
};
scanStaticDir();

/* Our HTTP Server */
var server = http.createServer(function(req, res) {
	var pathname = url.parse(req.url).pathname;

	if (pathname == '/getUsers') {
		/* Get Usernames of chat members. */
		setTimeout(function() {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Cache-Control', 'max-age=3600, must-revalidate');
			var responseString = JSON.stringify(userNameCache);
			/* See documentation of Buffer.byteLength on page: http://nodejs.org */
			res.setHeader('Content-Length', Buffer.byteLength(responseString, 'utf-8'));
			res.end(responseString);
		}, 3000);
		return;
	}

	if (pathname == '/') {
		/* main.html is our welcome page. */
		pathname = '/public/html/main.html';
	}
	
	var responseFile = null;
	var responseCode = null;
	if (filesCache[pathname]) {
		responseCode = 200;
		responseFile = filesCache[pathname];
	} else {
		/* Singleton design pattern. We just read 404 file once from HDD. */ 
		if (!error404File) {
			/* Read and cache 404 html  file. */ 
			var plain = fs.readFileSync(serverApp.dir + '/' + appDir + '/views/errors/404.html', 'binary');
			error404File = {
				plain: plain,
				contentType: 'text/html; charset=utf-8'
			}
		}
		responseCode = 404; 
		responseFile = error404File;
	}
	
	/* Put reseponse code, response header and content in resopnse object. */
	res.statusCode = responseCode;
	res.setHeader('Content-Type', responseFile.contentType);
	res.setHeader('Cache-Control', 'max-age=3600, must-revalidate');
	res.setHeader('Content-Length', responseFile.plain.length);
	res.end(responseFile.plain, 'binary');
});
/* Start server on port: 7777. */
server.listen(7777);
/* Log that server is successfully started on port. */
console.log('Server started, port: 7777');
console.log('Alex Modifications...');

/* Our little utility function for logging server events. */
var log = function(msg) {
	console.log(new Date() + ': ' + msg);
}

/* In this array we store all opened socket connections. */
var connections = [];

/* 
 * Key for this object is connected usernames. Value is true if username
 * still has active connection, false otherwise.
 */
var userNameCache = {};

// create the web socket server
var wsServer = new WebSocketServer({
	httpServer: server
});

wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);
	
	log('Another user connected');
	connections.push(connection);
	var username = null;

	/* Event when client sends message to server. */
	connection.on('message', function (message) {
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

