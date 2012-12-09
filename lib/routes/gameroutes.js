'use strict';

var GameController = require('../controllers/gamecontroller');

var routes = module.exports = function (app) {
	var gameController = new GameController(app);
		
	app.get('/bin/*', function (req, res, next) {
		gameController.proxy(req, res, next);
	});

	app.get('/lib/*', function (req, res, next) {
		gameController.proxy(req, res, next);
	});

	app.get('/assets/*', function (req, res, next) {
		gameController.proxy(req, res, next);
	});

	app.get('/play', function (req, res, next) {
		gameController.play(req, res, next);
	});
};