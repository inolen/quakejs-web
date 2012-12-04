'use strict';

var fs = require('fs');
var BlogController = require('../controllers/blogcontroller');
var ArticleRepository = require('../data/articlerepository');

var config = JSON.parse(fs.readFileSync(__dirname + '/../config.json','utf8'));

var routes = module.exports = function (app) {
	var articleRepository = new ArticleRepository(__dirname + '/../../' + config.paths.articles);
	var blogController = new BlogController(articleRepository);

	app.get('/', function (req, res, next) {
		blogController.index(req, res, next);
	});

	app.get('/articles/:article', function (req, res, next) {
		blogController.details(req, res, next);
	});
};