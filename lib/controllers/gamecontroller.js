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
	console.log('Proxying request for', req.url, 'to', this.proxyHost, this.proxyPort);

	// Delete old host header so http.request() sets the correct new one.
	// https://github.com/joyent/node/blob/master/lib/http.js#L1194
	delete req.headers['host'];

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

	preq.on('error', function (err) {
		return next(err);
	});

	req.pipe(preq);
};

GameController.prototype.play = function (req, res, next) {
	res.render('play');
};