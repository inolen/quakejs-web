'use strict';

var fs = require('fs');
var BlogController = require('../controllers/blogcontroller');
var ArticleRepository = require('../data/articlerepository');

var routes = module.exports = function (app) {
	var config = app.locals.config;
	var articleRoot = __dirname + '/../../' + config.paths.articles;
	var articleRepository = new ArticleRepository(articleRoot);
	var blogController = new BlogController(app, articleRepository);

	app.get('/', function (req, res, next) {
		blogController.index(req, res, next);
	});

	app.get('/articles/:article', function (req, res, next) {
		blogController.details(req, res, next);
	});

	app.get('/media', function (req, res, next) {
		blogController.media(req, res, next);
	});

	app.get('/about', function (req, res, next) {
		blogController.about(req, res, next);
	});
};