'use strict';

var async = require('async');
var dateformat = require('dateformat');
var fs = require('fs');
var md = require('markdown');
var path = require('path');

var ArticleModel = require('./articlemodel');

var ArticleRepository = module.exports = function (dir) {
	this.dir_ = dir;
};

ArticleRepository.prototype.getAllArticles = function (callback) {
	var self = this;

	async.waterfall([
		function findArticles(next) {
			fs.readdir(self.dir_, function (err, filenames) {
				if (err) {
					return callback(err);
				}

				next(null, filenames);
			});
		},
		function mapModels(filenames, next) {
			async.map(
				filenames,
				function (filename, cb) {
					var id = path.basename(filename, '.md');
					self.getArticle(id, cb);
				},
				function (err, models) {
					if (err) {
						return callback(err);
					}

					next(null, models);
				}
			);
		},
		function sortModels(models, next) {
			async.sortBy(
				models,
				function (model, cb) {
					cb(null, -model.published.raw);
				},
				function (err, results) {
					if (err) {
						return callback(err);
					}

					callback(null, results);
				}
			);
		}
	]);
};

ArticleRepository.prototype.getArticle = function (id, callback) {
	var self = this,
		// Call basename, don't allow rogue paths.
		filename = self.dir_ + '/' + id + '.md';

	fs.readFile(filename, 'utf8', function (err, data) {
		if (err) {
			return callback(err);
		}

		// Parse the tree and its meta-data
		var tree = md.markdown.parse(data, 'Maruku'),
			metadata = tree[1],
			title = metadata.title,
			published = metadata.published,
			body = md.markdown.toHTML(tree),
			description = body.substr(0, body.indexOf("<h2"));

		// Create article model.
		var model = new ArticleModel({
			title: title,
			published: {
				raw: Date.parse(published),
				formatted: dateformat(published, 'mmmm dS, yyyy')
			},
			body: body,
			description: description,
			url: '/articles/' + id
		});

		callback(null, model);
	});
};