'use strict';

var GameController = require('../controllers/gamecontroller');

var routes = module.exports = function (app) {
	var gameController = new GameController();
	
	app.get('/game/*', gameController.static);
	app.get('/play', gameController.play);
};