'use strict';

var async = require('async');
var express = require('express');
var fs = require('fs');

var config = {
	port: 8080,
	disqus: 'inolen',
	paths: {
		articles: 'articles'
	},
	assets: {
		host: 'localhost',
		port: 9000
	}
};
try {
	var data = require('config.json');
	_.extend(config, data);
} catch (e) {
}

/**
 * Start express.js HTTP server.
 */
var app = express();

app.locals.config = config;

/**
 * Set stack of middleware used to resolve requests.
 * Start with static data, then registered routes (app.router) and then move onto the error handlers.
 */
app.use(express.compress());

app.use(express.static(__dirname + '/public'));

// For any non-static resource, lets add these helper variables.
app.use(function (req, res, next) {
	res.locals.config = config;
	res.locals.request = req;
	next();
});

// Add in custom routes.
app.use(app.router);

// Finally, add in error handlers.
app.use(function (err, req, res, next) {
	console.log(err);
	res.status(500);
	res.render('500');
});

app.use(function (req, res) {
	res.status(404);
	res.render('404');
});

/**
 * Setup jade views as default.
 **/
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });

/**
 * Setup routes.
 */
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
	}],
	function (err) {
		console.log(err);
	});

/**
 * Start listening!
 */
app.listen(config.port);