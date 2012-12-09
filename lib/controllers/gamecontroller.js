'use strict';

var http = require('http');
var fs = require('fs');
var path = require('path');

var GameController = module.exports = function (app) {
	var config = app.locals.config;

	this.gameRoot = path.normalize(process.cwd() + '/' + config.gameRoot);
	this.proxyHost = config.content.host;
	this.proxyPort = config.content.port;

	console.log('GameController initialized with content proxy ' + this.proxyHost + ':' + this.proxyPort);
};

GameController.prototype.proxy = function (req, res, next) {
	console.log('Proxying request for', req.url);
	var preq = http.request({
		host: this.proxyHost,
		port: this.proxyPort,
		path: req.url,
		method: req.method,
		headers: req.headers
	}, function (pres) {
		res.writeHead(pres.statusCode, pres.headers);
		pres.pipe(res);
	});
	req.pipe(preq);
};

GameController.prototype.play = function (req, res, next) {
	res.render('play');
};