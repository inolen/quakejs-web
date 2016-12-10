'use strict';

var HomeController = module.exports = function (app) {
};

HomeController.prototype.index = function (req, res, next) {
	res.render('index');
};

HomeController.prototype.discuss = function (req, res, next) {
	res.render('discuss');
};

HomeController.prototype.play = function (req, res, next) {
	res.render('play');
};
