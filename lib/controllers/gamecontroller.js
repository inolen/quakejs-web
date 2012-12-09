'use strict';

var httpProxy = require('http-proxy');
var fs = require('fs');
var path = require('path');

var gameRoot = path.normalize(__dirname + '/../../../quakejs');
var includes = require(gameRoot + '/build/includes.js');

var GameController = module.exports = function (app) {
	var config = app.locals.config;

	this.proxy = new httpProxy.RoutingProxy();
	this.proxy.on('proxyError', function (err, req, res) {
		console.error(err);
	});

	this.proxyOptions = {
		host: config.assets.host,
		port: config.assets.port
	};
};

GameController.prototype.bins = function (req, res, next) {
	var path = gameRoot + req.url;

	fs.stat(path, function (err, stat) {
		if (err) return next(err);
		res.sendfile(path);
	});
};

GameController.prototype.assets = function (req, res, next) {
	this.proxy.proxyRequest(req, res, this.proxyOptions);
};

GameController.prototype.play = function (req, res, next) {
	res.render('play');
};