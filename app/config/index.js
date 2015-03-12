/*
*  main configuration file, for db password, some config options
*
*/

var config = {
	dev: {
		mode: 'dev',
		port: 8000,
		mongo: {
			host: '127.0.0.1',
			port: 27017
		}
	},
	production: {
		mode: 'production',
		port: 8000,
		mongo: {
			host: '127.0.0.1',
			port: 27017
		}
	}
}
module.exports = function(mode) {
	return config[mode || process.argv[2] || 'dev'] || config.local;
}