'use strict';

var ArticleModel = module.exports = function (properties) {
	var key;

	this.title = 'N/A';
	this.published = new Date();
	this.body = 'N/A';

	for (key in properties) {
		if (properties.hasOwnProperty(key)) {
			this[key] = properties[key];
		}
	}
};