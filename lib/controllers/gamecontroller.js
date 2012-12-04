'use strict';

var path = require('path');

var gameRoot = path.normalize(__dirname + '/../../../quakejs');
var includes = require(gameRoot + '/build/includes.js');

var GameController = module.exports = function () {
};

GameController.prototype.static = function (req, res, next) {
	var path = gameRoot + '/' + req.params[0];
	res.sendfile(path);
};

GameController.prototype.play = function (req, res, next) {
	res.render('play');
};