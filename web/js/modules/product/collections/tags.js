define([
	'underscore',
	'backbone',
	'../models/tag'
], function(_, Backbone, TagModel){
	
	var TagsList = Backbone.Collection.extend({
		model: TagModel,
		url: '/api/store/tags/',
		exists: function(name){
			return this.find(function(tag){return tag.get('name').toLowerCase() == name.toLowerCase();});
		}
	});
	
	return TagsList;
});