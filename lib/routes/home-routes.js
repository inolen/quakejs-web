'use strict';

var fs = require('fs');
var HomeController = require('../controllers/home-controller');

var routes = module.exports = function (app) {
	var homeController = new HomeController(app);

	app.all('/', function (req, res, next) {
		homeController.index(req, res, next);
	});

	app.get('/discuss', function (req, res, next) {
		homeController.discuss(req, res, next);
	});

	app.get('/play', function (req, res, next) {
		homeController.play(req, res, next);
	});
};
