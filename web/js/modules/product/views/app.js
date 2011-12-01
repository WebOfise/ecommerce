define([
	'libs/underscore/underscore',
	'libs/backbone/backbone',
	'modules/product/models/product',
	'modules/product/views/category',
//	'modules/product/collections/options',
	'modules/product/models/option',
	'modules/product/views/option',
	'modules/product/views/productlist'
], function(_, Backbone, ProductModel, CategoryView, /*OptionCollection,*/ ProductOption, ProductOptionView, ProductListView){

	var AppView = Backbone.View.extend({
		el: $('#manage-product'),
		events: {
			'keypress input#new-category': 'newCategory',
			'click #add-new-option-btn': 'newOption',
			'click #submit': 'saveProduct',
			'change #product-image-folder': 'imageChange',
			'click div.box': 'setProductImage',
			'change [data-reflection=property]': 'setProperty',
			'change #product-enabled': 'toggleEnabled',
			'click input[name^=category]': 'toggleCategory',
			'click #delete': 'deleteProduct',
			'click #related-holder span.ui-icon-closethick': 'removeRelated',
            'change #product-brand': 'setBrand',
            'keypress input#new-brand': 'newBrand'
		},
		websiteUrl: $('#websiteUrl').val(),
		initialize: function(){
			//initializing jQueryUI elements
			$(this.el).tabs();
			$('#description-box').tabs();
			$('#delete,#add-new-option-btn').button();
			$('#add-related').autocomplete({
				minLength: 3,
				select: this.addRelated,
				source: this.filterProductList
			}).data( "autocomplete" )._renderItem = this.renderAutocomplete;

//			this.initBrandAutocomplete();
			this.newCategoryInput = this.$('#new-category');


			$(".ui-tabs-nav, .ui-tabs-nav > *" )
				.removeClass( "ui-corner-all" )
				.addClass( "ui-corner-top" );
		},
		setModel: function (model) {
			this.model = model;
			this.model.bind('change', this.render, this);
			this.model.bind('change:related', this.renderRelated, this);
			this.model.view = this;
			this.render();
		},
		toggleEnabled: function(e){
			this.model.set({enabled: this.$('#product-enabled').prop('checked') ? 1 :0 });
			console.log(this.model.get('enabled'));
		},
		newCategory: function(e){
			var name = this.newCategoryInput.val();
			if (e.keyCode == 13 && name !== '') {
			   appRouter.categories.create({name: name}, {
				   success: function(model, response){
					   $('#new-category').val('').blur();
				   },
				   error: function(model, response){
					   smoke.alert(response.responseText);
				   }
			   });
			}
		},
		toggleCategory: function(e){
			var checkedCategories = [];

			_.each($('input[name^=category]:checked'), function(el){
				checkedCategories.push(appRouter.categories.get( el.value ).toJSON());
			});

			this.model.set({categories: checkedCategories});
		},
		newOption: function(){
			var newOption = new ProductOption();
			var optWidget = new ProductOptionView({model: newOption});
			this.model.get('options').add(newOption);
			$('#options-holder').append(optWidget.render().el);
			optWidget.addSelection();
		},
		imageChange: function(e){
			var folder = $(e.target).val();
			if (folder == '0') {
				return;
			}
			$.post('/backend/backend_media/getdirectorycontent', {folder: folder}, function(response){
				var $box = $('#image-list');
				$box.empty();
				if (response.hasOwnProperty('imageList') && response.imageList.length ){
					var $images = $('#imgTemplate').tmpl(response);
					$box.append($images).imagesLoaded(function(){
						$(this).masonry('reload')
					});
				} else {
					$box.append('<p>Empty</p>');
				}
				$('#image-select-dialog').show('slide');
			});
		},
		setProductImage: function(e){
			var src = $(e.currentTarget).find('img').attr('src');
			this.$('#image-select-dialog').hide('slide');
			this.$('#product-image-folder').val(0);
			this.model.set({photo: src});
		},
		setProperty: function(e){
			var propName = e.currentTarget.id.replace('product-', '');
			var data = {};
			data[propName] = e.currentTarget.value;
			this.model.set(data);
		},
		render: function(){
			$('#quick-preview').empty();

			//setting model properties to view
			if (this.model.has('photo')){
				this.$('#product-image').attr('src', this.model.get('photo'));
			} else {
				this.$('#product-image').attr('src', this.websiteUrl+'system/images/noimage.png');
			}
			this.$('#product-name').val(this.model.get('name'));
			this.$('#product-sku').val(this.model.get('sku'));
			this.$('#product-mpn').val(this.model.get('mpn'));
			this.$('#product-weight').val(this.model.get('weight'));
			this.$('#product-brand').val(this.model.get('brand')).trigger('change');
			this.$('#product-price').val(this.model.get('price'));
			this.$('#product-taxClass').val(this.model.get('taxClass'));
			this.$('#product-shortDescription').val(this.model.get('shortDescription'));
			this.$('#product-fullDescription').val(this.model.get('fullDescription'));

			// loading option onto frontend
			$('#options-holder').empty();
			if (this.model.has('options')) {
				console.log(this.model.get('options'));
				this.model.get('options').each(function(option){
					var optWidget = new ProductOptionView({model: option});
					$('#options-holder').append(optWidget.render().el);
				});
			}
			//populating selected categories
			$('#product-categories').find('input:checkbox:checked').removeAttr('checked');
			if (this.model.has('categories')){
				_.each(this.model.get('categories'), function(category, name){
					var el = appRouter.categories.get(category.id).view.el;
					$(el).find(':checkbox').attr('checked','checked');
				});
			}
			//toggle enabled flag
			if (this.model.get('enabled')){
				this.$('#product-enabled').attr('checked', 'checked');
			} else {
				this.$('#product-enabled').removeAttr('checked');
			}

			if (this.model.has('page')){
				$('<a></a>', {href: $('#websiteUrl').val()+this.model.get('page').url, target: '_blank'})
					.html(this.model.get('page').h1)
					.appendTo('#quick-preview');
				this.$('#product-pageTemplate').val(this.model.get('page').templateId);
			} else {
				this.$('#product-pageTemplate').val('-1');
			}
			$('#image-list').masonry({
				itemSelector : '.box',
				columnWidth : 120
			});
			$(this.el).show();
		},
		saveProduct: function(){
			//@todo: make messages translatable
			if (!this.model.get('options').isEmpty()){
				var list = this.model.get('options').toJSON();
                console.log(list);
				this.model.set({defaultOptions: list});
			}
			if (!this.model.has('pageTemplate')){
				var templateId = this.$('#product-pageTemplate').val();
				templateId = templateId !== '-1' ? templateId : 'default';
				this.model.set({pageTemplate: templateId});
			}

			if (this.model.isNew()){
				this.model.save(null, {success: function(model, response){
					smoke.alert('Product added');
					appRouter.products.add(model);
					appRouter.navigate('edit/'+model.id, true);
				}});
			} else {
				this.model.save(null, {success: function(model, response){
					smoke.alert('Product saved');
					appRouter.app.model.fetch({data: {id: model.id}});
				}});
			}
		},
		deleteProduct: function(){
			var model  = this.model;
			if (model.isNew()){
				$('#product-name').focus();
				return false;
			}
			smoke.confirm('Dragons ahead! Are you sure?', function(e){
				if (e){
					model.destroy({
						success: function(){
							appRouter.products.fetch().done(function(){
								appRouter.navigate('list', true);
							});
						}
					});
				}
			});
		},
		initBrandAutocomplete: function(){
			$('#product-brand').autocomplete({
				minLength: 2,
				source: function (request, response){
					var elem = $('#product-brand'),
						xhrCache = {},
						lastXhr;
					if ( elem.data('xhrCache') === undefined){
						elem.data('xhrCache', xhrCache);
					} else {
						xhrCache = elem.data('xhrCache');
					}

					if ( elem.data('lastXhr') === undefined){
						elem.data('lastXhr', lastXhr);
					} else {
						lastXhr = elem.data('lastXhr');
					}

					var term = request.term ;

					if (xhrCache === undefined) {
						xhrCache = {};
						elem.data('xhrCache', xhrCache);
					}

					if ( term in xhrCache ){
						response(xhrCache[term]);
						return;
					}
					lastXhr = $.getJSON($('#websiteUrl').val()+'/plugin/shopping/run/getdata/type/brands/', request, function(data, status, xhr){
						xhrCache[ term ] = data;
						if ( xhr === lastXhr ){
							response(data);
						}
					});

				},
				select: function( event, ui ) {
					$('#product-brand').val(ui.item.name)
						.data('brandId', ui.item.id)
						.trigger('change');
					return false;
				}
			}).data( "autocomplete" )._renderItem = function( ul, item ) {
				return $( "<li></li>" )
					.data( "item.autocomplete", item )
					.append( "<a>" + item.name + "</a>" )
					.appendTo( ul );
			};
		},
		filterProductList: function(request, response){
			var list = appRouter.products.filter(function(prod){
				var search = request.term.toLowerCase();
				if (!appRouter.app.model.isNew() && appRouter.app.model.get('id') === prod.get('id')){
					return false;
				}
				if (prod.get('name').toLowerCase().indexOf(search) != -1) {
					return true;
				}
				if (prod.get('sku').toLowerCase().indexOf(search) != -1) {
					return true;
				}
				if (prod.get('name').toLowerCase().indexOf(search) != -1) {
					return true;
				}
			});
			response(list);
		},
		renderAutocomplete: function( ul, item ) {
			return $( "<li></li>" )
				.data( "item.autocomplete", item )
				.append( "<a><img style='float:right' src="+
					(item.has('photo')?item.get('photo').replace('/small/','/product/'):'/system/images/noimage.png')
					+" /><div>"
					+ item.get('name').toUpperCase() 
					+ "<br>SKU:" 
					+ item.get('sku') 
					+ "<br />"
					+item.get('brand')+"</div></a>" 
				).appendTo( ul );
		},
		addRelated: function( event, ui ) {
			var related = _(appRouter.app.model.get('related')).toArray(),
				id	= ui.item.get('id');
			if (related.indexOf(id) === -1){
				related.push(id);
				appRouter.app.model.set({related: related});
			}
			//return false;
		},
		removeRelated: function(el){
			var id = $(el.target).closest('div.productlisting').find('a').attr('href').replace('#edit/',''),
				related = _.without(_(this.model.get('related')).toArray(), parseInt(id));
			this.model.set({related: related});
		},
		renderRelated: function(){
			$('#related-holder').empty();
			_(this.model.get('related')).each(function(productId){
				var product = appRouter.products.get(parseInt(productId)),
					view	= new ProductListView({model: product, showDelete: true});

				$('#related-holder').append(view.render().el);
			});
		},
        setBrand: function(e){
            var el = $(e.target);
            var url = el.find('option:eq('+e.target.options.selectedIndex+')').data('url');
            if (url){
                $('label[for=product-brand] > a').attr('href', $('#websiteUrl').val()+url);
            } else {
                $('label[for=product-brand] > a').attr('href', 'javascript:;');
            }
            this.model.set({brand: el.val()});
        },
        newBrand: function(e){
            var newBrand = this.$('#new-brand').val();
            if (e.keyCode === 13 && newBrand !== '') {
                var current = appRouter.brands.pluck('name').map(function(item){ return item.toLowerCase()});
                if (!_.include(current, newBrand.toLowerCase())){
                    appRouter.brands.create({
                        'name': newBrand
                    }, {success: function(model){
                        $('#product-brand').val(model.get('name')).trigger('change').focus();
                    }});
                } else {
                    var brand = appRouter.brands.find(function(item){
                        return item.get('name').toLowerCase() == newBrand.toLowerCase();
                    });
                    $('#product-brand').val(brand.get('name')).trigger('change').focus();
                }

                this.$('#new-brand').val('');
            }
        }
	});

	return AppView;
});