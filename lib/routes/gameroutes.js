'use strict';

var GameController = require('../controllers/gamecontroller');

var routes = module.exports = function (app) {
	var gameController = new GameController(app);
	
	app.get('/bin/*', function (req, res, next) {
		gameController.bins(req, res, next);
	});
	
	app.get('/assets/*', function (req, res, next) {
		gameController.assets(req, res, next);
	});

	app.get('/play', function (req, res, next) {
		gameController.play(req, res, next);
	});
};