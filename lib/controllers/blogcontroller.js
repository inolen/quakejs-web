'use strict';

var BlogController = module.exports = function (app, articleRepository) {
	this.articleRepository_ = articleRepository;
};

BlogController.prototype.index = function (req, res, next) {
	this.articleRepository_.getAllArticles(function (err, articles) {
		if (err) {
			return next(err);
		}

		res.render('index', {
			title: 'inolen.com',
			articles: articles
		});
	});
};

BlogController.prototype.details = function (req, res, next) {
	var id = req.params.article;

	this.articleRepository_.getArticle(id, function (err, article) {
		if (err) {
			return next(err);
		}

		res.render('article', {
			title: article.title,
			article: article
		});
	});
};

BlogController.prototype.media = function (req, res, next) {
	res.render('media', {
		title: 'Media'
	});
};

BlogController.prototype.about = function (req, res, next) {
	res.render('about', {
		title: 'about'
	});
};