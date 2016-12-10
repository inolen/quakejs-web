'use strict';

var _ = require('underscore');
var async = require('async');
var expiry = require('static-expiry');
var flash = require('connect-flash');
var engine = require('ejs-locals');
var express = require('express');
var force = require('express-force-domain');
var fs = require('fs');
var path = require('path');

var argv = require('optimist')
	.describe('config', 'Location of the configuration file').default('config', './config.json')
	.argv;

if (argv.h || argv.help) {
	opt.showHelp();
	return;
}

function createServer(config) {
	var app = express();

	//
	// set stack of middleware used to resolve requests
	//
	if (config.domain) {
		app.use(force(config.domain));
	}
	app.use(express.compress({
		filter: function(req, res) {
			var ext = path.extname(req.url);
			return /json|text|javascript/.test(res.getHeader('Content-Type'));
		}
	}));
	['public', 'views'].forEach(function (dir) {
		dir = path.join(__dirname, dir);
		app.use(expiry(app, { dir: dir, cacheControl: 'public' }));
		app.use(express.static(dir, { maxAge: Infinity }));
	});
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'venus' }));
	app.use(flash());
	app.use(function (req, res, next) {
		res.locals.config = config;
		res.locals.request = req;

		res.locals.getErrors = function () {
			var errors = req.flash('error');

			var err;
			if ((err = req.param('error', null))) {
				errors.push(err)
			}

			return errors;
		};

		next();
	});
	app.use(app.router);
	app.use(function (err, req, res, next) {
		console.error(err);
		res.render('500');
	});
	app.use(function (req, res) {
		res.render('404');
	});

	//
	// setup ejs views as default
	//
	app.engine('ejs', engine);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');

	//
	// setup routes
	//
	var dirRoutes = __dirname + '/lib/routes/';

	async.waterfall([
		function (next) {
			fs.readdir(dirRoutes, function (err, files) {
				if (err) {
					return next(err);
				}

				next(null, files);
			});
		},
		function (files, next) {
			files.forEach(function (file) {
				console.log('Adding routes from "' + dirRoutes + file + '"');
				require(dirRoutes + file)(app);
			});
		}
	],
	function (err) {
		console.log(err);
	});

	//
	// start listening!
	//
	app.listen(config.port);
	console.log('Server is now listening on port', config.port);
}

function loadConfig(configPath) {
	var config = {
		// domain: 'http://www.quakejs.com',
		port: 8080,
		content: {
			host: 'localhost',
			port: 9000
		},
		master: {
			host: 'localhost',
			port: 27950
		}
	};

	try {
		console.log('Loading config file from ' + configPath + '..');
		var data = require(configPath);
		_.extend(config, data);
	} catch (e) {
		console.log('Failed to load config', e);
	}

	return config;
}

(function main() {
	var config = loadConfig(argv.config);
	createServer(config);
})();
