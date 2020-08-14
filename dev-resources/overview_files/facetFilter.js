var facetFilterApp = {
	/**
	* Frameworks used:
	* 	JQuery v3.3.1 (https://jquery.com/)
	*	selectize.js v0.12.6 (https://github.com/selectize/selectize.js)
	*	foundations.js v6.5.1 (only drilldown and needed components) (https://foundation.zurb.com/)
	*
	* this App handles all functions regarding the facet filters;
	* the App is build in a way, that all functions can be called outside from this App to be reusable;
	*
	* all functions with "Selectize" in it's function name regard to the selectize Framework and 
	* therefore only work with "selectized" HTML-selects;
	* 
	* @author: Mark Engelhard - Smaser AG - 2019
	**/

	/**
	* initial variables;
	**/
	facetFilterUrl : "filterlist,0-0-0-0-0-0-0-0-0-0-0.html",
	categoryKey : "category.filter",
	$filterForm : null,
	$resetButton : null,
	$ajaxInterval : 1000,
	$ajaxIntervalSet : false,

	init: function(translationBack){
		/** 
		* DOM Elements;
		* getting initialized in init() because initialization of
		* facetFilterApp is faster than DOM loading;
		**/
		this.$categoryAnkers = "";
		this.$categoryDrilldown = "";
		this.$filterNav = $(".filter-nav");
		this.$filterNavToggle = this.$filterNav.find(".toggle-content");
		this.$filterNavOpen = this.$filterNav.find("label.open");
		this.$filterNavClose = this.$filterNav.find("label.close");
		this.$filterForm = $("form[name='filter-form']");
		this.$applyButton = this.$filterNav.find(".apply");
		this.$resetButton = $(this.$filterForm).find(".button .reset");
		this.$categoryFieldset = $(".multi-column fieldset").first();
		this.$categoryLabel = $(".multi-column label[for='input_category']");
		this.$categoryHiddenInput = $("input[name='"+ this.categoryKey +"']");		

		/**
		* needed for the category drilldown's back button;
		* because translations are stored in database, app needs it given as a parameter;
		* is passed in the init()-call in filterNav.jsp (according to current language);
		**/
		this.translationBackButton = translationBack;

		/** 
		* used to detect, if the current state is the initial facetFilterApp loading at pageload;
		* gets changed in processFacetJSON();
		**/
		this.isInit = true;

		/*initialization*/		
		this.initializeFacetFilter(this.$filterForm);
		this.bindEventlistener();		
	},
	bindEventlistener: function(){
		/**
		* registeres all needed eventlisteners;
		* ! eventListener for category facet ankers are registered in processCategoryFilter() !
		* ! eventListener for deleting facet items on("click") are registered in processFacetJSON() !
		* ! eventListeners for previewItems are set in selectizeSelects() !
		**/
		this.$resetButton.click(function(){
			$('#simple-search form').submit();
			/*
			facetFilterApp.resetCategoryFacet();
			facetFilterApp.resetSelectizeSelects(facetFilterApp.$filterForm);
			facetFilterApp.refreshFacetFilter(true);			
			facetFilterApp.removeAllPreviewItems();		
			*/
		});
		this.$filterForm.find("input:not('.reset, .apply'), select").change(function(){			
			facetFilterApp.refreshFacetFilter(false);
		});
	},
	bindItemEventlisteners: function(){
		/**
		* binds the eventListeners for the facet-items inside the filterform;
		* seperate function, because they have to be reset everytime an item is added;	
		**/
		$("form .item").off();
		$("form .item").click(function(){
			var elem = $(this).parents(".selectize-select").siblings(".selectize-select");
			var filterVal = $(this).attr("data-value");
			var filterName = $(elem).attr("name");
			
			facetFilterApp.removeSelectItem(elem, filterVal);			
			elem[0].selectize.showInput();
			facetFilterApp.removePreviewItem(filterVal, filterName);
		});
	},
	bindCategoryEventlistener: function(){
		facetFilterApp.$categoryDrilldown.foundation();
		
		facetFilterApp.$categoryAnkers = $(".is-drilldown-submenu-parent a, is-submenu-item a");

		/** delete all foundation listeners on ankers, because they stop click event propagation **/
		facetFilterApp.$filterNav.find(".menu.drilldown .is-drilldown-submenu-parent a").off();

		facetFilterApp.$categoryAnkers.click(function(){
			var filterVal = $(this).attr("data-value");
			var text = $(this).text();
			/** cut out the result counter for previewItem **/
			var filterTitle = text.substring("0", text.indexOf(" ("));
			var parent = $(this).parent();

			if( parent.hasClass("is-drilldown-submenu-parent") ){				
				facetFilterApp.handleActiveStateCategories(parent.children("ul").children(".is-submenu-parent-item").children("a"));
				facetFilterApp.showSubmenu(parent);
			}else{
				facetFilterApp.handleActiveStateCategories(this);
			}

			facetFilterApp.removePreviewItem("", facetFilterApp.categoryKey);			
			facetFilterApp.addPreviewItem(filterVal, filterTitle, facetFilterApp.categoryKey);
			facetFilterApp.resetSelectizeSelects(facetFilterApp.$filterForm);
			facetFilterApp.refreshFacetFilter(false);
		});
	},
	initializeFacetFilter: function(form){
		/**	
		* initialize the facetteFilters from given form;
		* params:
		* 	form -> JQuery Object
		**/
		this.disableApplyButton();
		this.selectizeSelects(form);
		this.resetSelectizeSelects(form);
		
		$.getJSON(facetFilterApp.getFacetCrontrollerUrl(), function(json){
			facetFilterApp.setAjaxCheckInterval();		
			facetFilterApp.processFacetJSON(json, facetFilterApp.$filterForm, false);
		}).fail(function(){
			console.error("Error in initializeFacetFilter() - Ajax request failed");
		});		
	},
	refreshFacetFilter: function(reload){
		/**
		* reload -> boolean
		*	handles, whether the category facet should be reloaded or not
		**/
		this.disableApplyButton();

		$.post(facetFilterApp.getFacetCrontrollerUrl(), facetFilterApp.$filterForm.serialize(), function(json) {
			facetFilterApp.setAjaxCheckInterval();
     		facetFilterApp.processFacetJSON(json, facetFilterApp.$filterForm, reload);
       	}).fail(function(error){
			console.error("Error in refreshFacetFilter() -> Ajax request failed");
		});
	},
	processFacetJSON: function(json, form, reload){
		/**
		* adds all entries given in the rensponse JSON as options to the 
		* appropriate select input;
		* also handles enabling and disabling the selects;
		* params:
		* 	json -> response JSON from the filter service;
		*	form -> JQuery Object
		*	reload -> boolean
		*		prevents the category facet to be realoaded after a category was selected
		**/
		if(json.facets != undefined){
			facets = json.facets.facets;

			for(var i = 0; i <= facets.length - 1; i++){
				
				currentFacet = facets[i];
				key = currentFacet.key;

				/** the given filters in if-clause are either checkboxes or the category drilldown (or wrong key's comming from the json), therefore no need to process them here **/
				if(	
					key != this.categoryKey &&
					key != "unlimited.filter" && 
					key != "availability.filter" && 					
					key != "hierarchy_category_path_level_2"
				){				
					entries = currentFacet.entries;
					select = form.find("select[name='" + key +"']");

					if(select === undefined || select[0] === undefined){
						/** if there are incorret key's comming from facet JSON throw an error **/
						console.error("Error in processFacetJSON -> couldn't find select with key " + key);
					}else if(entries === undefined || entries.length == 0){
						/** 
						* if this facet has no entries, disable it;
						* comes with "undefined" because in this case the facet in the JSON only has a title and a key as entries;
						**/
						this.disableSelectizeSelect(select);
					}else{
						/** if the select was disabled an now has options again, reenable it **/
						if(select[0].disabled){
							this.enableSelectizeSelect(select);
						}
						
						this.deleteSelectOptions(select);
						
						for(var j = 0;j <=  entries.length - 1; j++){

							entry = entries[j];

							value = entry.value[0];
							title = entry.title;
							count = entry.count.toString();
							selected = entry.selected;
							
							options = {value: value, text: title, count: count};

							this.addSelectOption(select, options);
							select[0].selectize.refreshOptions(false);

							if(selected){//} || (this.isInit && entries.length == 1) ){
								/** 
								*	preselect the option, if it either was selected beforehand 
								* 	or only one exists and it's the initial pageload;
								**/
								this.addSelectItem(select, value);
							}						
						}
					}
				}else if(key == this.categoryKey && (this.isInit || reload)) {
					if(reload){
						this.$categoryDrilldown.foundation("_destroy");
						this.$categoryDrilldown.remove();
					};
					this.processCategoryFilter(currentFacet);			
				};
			};
			/** register eventListeners for customized selectize item delete function **/
			this.bindItemEventlisteners();
		}else{
			console.error("Error in processFacetJSON() -> json.facets undefined");
		};
		this.isInit = false;
	},
	processCategoryFilter: function(categories){
		/**
		* processes the category filter seperatly, because it's a drilldown menu and not a select;
		* builds the HTML markup needed to initialize the foundation drilldown menu;
		* param: 
		*	categories -> category part from facet-JSON 
		**/

		/* custom back button, because we have to use translations for the word "back" */
		drilldownBackButtonHtml = "<li class='js-drilldown-back'><a tabindex='0'><div>" + 
								  	this.translationBackButton + 
								  "</div></a></li>";

		/**
		* outer <ul> wrapper of the initial drilldown markup;
		* different data-attributes represent different drilldown options (can be found in foundation docs);
		**/
		drillDownHtml = '<ul class="vertical menu drilldown category-drilldown"' + 
						' data-drilldown' +
						' data-back-button="' + drilldownBackButtonHtml + '"' + 						
						' data-parent-link="true"' +
						' data-auto-height="true"' +
						' data-animate-height="true">';

		entries = categories.entries;

		if(entries != undefined && entries.length > 0){
			for(var i = 0;i < entries.length; i++){
				entry = entries[i];

				level = entry.level;
				selected = entry.selected;
				categoryTitle = entry.title;
				categoryCount = entry.count;
				categoryValue = entry.value;
								
				hasSubMenu = false;
				closeSubMenu = false;
				levelDifference = 0;

				/**
				* here the function checks, if the level from the next entry (except it's the last one)
				* is higher or lower than the current one; 
				* depending on that, close the submenu or leave it "open";
				* in the facet-JSON the category entries are sorted after the menu levels;
				* so the structure of the JSON looks like:
				* 	[0] level 0	-> root
				* 	[1]	level 1	-> main category
				*	[2]	level 2 -> subcategory from entry [1]
				* 	[3]	level 3 -> subcategory from entry [2]
				*	[4] level 1 -> main category 
				*	[5]	level 2 -> subcategory from [4]
				* 	... etc.
				**/

				if(i != (entries.length - 1)){
					nextCategoryLevel = entries[i+1].level;

					if(nextCategoryLevel > level){
						hasSubMenu = true;
					}else if(nextCategoryLevel < level){
						levelDifference = level - nextCategoryLevel;
						closeSubMenu = true;
					}

				}else if(i == (entries.length - 1) && level >= 1){		
					levelDifference = level;			
					closeSubMenu = true;
				}

				if(selected){
					this.addPreviewItem(categoryValue, categoryTitle, this.categoryKey);
				}

				drillDownHtml += this.createCategoryLevel(categoryTitle, categoryCount, categoryValue, levelDifference, hasSubMenu, closeSubMenu, selected);
			}
		}else{
			console.error("Error in processCategoryFilter() -> categories undefined or categories.length = 0");
		}

		drillDownHtml += '</ul>';
		
		/* if there is already a drilldown menu, remove it */
		this.$categoryFieldset.find(".is-drilldown").remove();
		this.$categoryFieldset.find(".drilldown").remove();

		/* pre parse HTML before injecting into page */
		html = $($.parseHTML(drillDownHtml));		
		$(html).insertAfter(this.$categoryLabel);

		this.$categoryDrilldown = $(".drilldown");

		/** 
		* if the filterform is closed, use timeout after form is openend
		* because otherwise height calculation of foundation drilldown is wrong;
		* eventListener registration for category facet ankers here, because on bindEvetListener() call
		* the facet isn't alreday injected in the page;
		**/
		if( this.$filterNavToggle.is(":visible") ){			
			this.bindCategoryEventlistener();		
		}else{
			this.$filterNavOpen.click(function(){
				setTimeout(function(){					
					facetFilterApp.bindCategoryEventlistener();
				}, 100);				
			});
		};
	},
	createCategoryLevel: function(title, count, value, difference, hasSubMenu, closeSubMenu, isSelected){
		/**
		* builds the single menu elements for the category drilldown;
		* params:
		*	title -> string
		*	count, value -> int
		* 	hasSubMenu, closeSubMenu -> boolean
		*		-> used to handle the opening and closing tags from the category level
		*	isSelected -> boolean
		*	difference -> int
		*		-> level difference between current and previous category; 
		*		   detect how many closing tags have to be used;
		* return:
		*	html -> string (html markup)
		**/
		html = "";
		selected = isSelected ? 'class="active"' : '';
		
		if(
			title != undefined &&
		   	title != "" && 
		   	count != undefined && 
		   	value != undefined
		){
			if(hasSubMenu){
				html += '<li><a href="#category_facet" data-value="' + value + '"><div>' + title + ' (' + count + ')</div></a>';
				html += '<ul class="menu vertical nested">';
			}else{
				html += '<li ' + selected + '><a href="#category_facet" data-value="' + value + '"><div>' + title + ' (' + count + ')</div></a></li>';
			}
		}else{
			console.error("Error in createCategoryLevel() -> title, count or value empty or undefined");
		}

		if(closeSubMenu){
			for(var i = 0;i < difference; i++){
				html += '</ul></li>';
			}			
		};

		return html;
	},
	handleActiveStateCategories: function(elem){
		if( $(elem).attr("href") != undefined ){

			var filterVal = $(elem).attr("data-value");

			this.$categoryAnkers.each(function(){
				facetFilterApp.removeActiveClass($(this).parent());
			});

			this.addActiveClass($(elem).parent());			
		}
	},
	writeCategoryValue: function(value){
		/**
		* writes the value from the clicked drilldown element to the hidden input field;
		* provides that the right value gets collected on form submit;
		**/
		if( value != undefined && this.$categoryHiddenInput != undefined){
			this.$categoryHiddenInput.val(value);
		}else{
			console.error("Error in writeCategoryValue() -> value or inputfield undefined");
		};
	},
	removeCategoryValue: function(){
		if(this.$categoryHiddenInput != undefined){
			this.$categoryHiddenInput.val("");
		}else{
			console.error("Error in removeCategoryValue -> $categoryHiddenInput undefined");
		};
	},
	resetCategoryFacet: function(){
		this.removeCategoryValue();
		/** 
		* emulate click on first back button to prevent menu do go back to root;
		* first back button to be independent from (sub-)menu level
		**/	
		$(".js-drilldown-back").first().click();
		this.$categoryAnkers.each(function(){					
			facetFilterApp.removeActiveClass($(this).parent());
		});
	},
	selectizeSelects: function(form){
		/** 
		* uses selectize.js framework to "selectize" select-input fields;
		* params: 
		* 	form -> JQuery Object
	 	**/
	 	form.find("select").each(function(){
			$(this).selectize({
				valueField: 'value',
				render: {
					option: function(item, escape) {
						return '<div class="option" data-selectable data-value="' + 
									escape(item.value)	+ 
								'">' +
									escape(item.text) +
									'<span class="option-count">' + 
										' (' + escape(item.count) + ')' +
									'</span>' +
								'</div>';
					},
					item: function(item, escape) {
						return '<div class="item" data-value="' +
									escape(item.value) +
								'">' +
									escape(item.text) +
									'<div class="item-remove"></div>' +
								'</div>';
					}
				}
			});
			$(this)[0].selectize.on("item_add", function(value, $item){
				var filterName = $(this)[0].$input.attr("name");
				facetFilterApp.addPreviewItem(value, $($item).text(), filterName);
				facetFilterApp.bindItemEventlisteners();
			});
			$(this)[0].selectize.on("item_remove", function(value){
				var filterName = $(this)[0].$input.attr("name");
				facetFilterApp.removePreviewItem(value, filterName);
			});
		});
	},
	enableSelectizeSelect: function(select){
		select[0].selectize.enable();
	},
	disableSelectizeSelect: function(select){
		select[0].selectize.disable();
	},
	resetSelectizeSelects: function(form){
		/** 
		* uses selectize.js framework to reset "selectized" select-input fields;
		* does not work with "normal" selects;
		* silent:true -> no change event gets fired,
		* so the change-Eventlistener set in bindEventlistener() won't be triggered;
		* params: 
		* 	form -> JQuery Object
		**/
		form.find("select").each(function(){
			facetFilterApp.removePreviewItem("", $(this).attr("name"));
			this.selectize.clear({silent:true});
		});		
	},
	addSelectOption: function(select, options){
		select[0].selectize.addOption(options);
	},
	deleteSelectOptions: function(select){
		select[0].selectize.clearOptions();
	},
	addSelectItem: function(select, value){
		/**
		* add's the option with the given value as selected;
		* true -> "silent": no change event get's fired;
		**/
		select[0].selectize.addItem(value, true);		
	},
	removeSelectItem: function(select, value){
		select[0].selectize.removeItem(value);		
	},	
	addPreviewItem: function(value, title, filterName){		
		if(
			value 		!= "" &&
			title 		!= "" &&
			filterName 	!= ""
		){
			html = '<div class="item" data-facet="' + filterName + '" data-value="' + value + '">' + title + '</div>';
			$(html).insertAfter(this.$filterNavClose);

			if(filterName == this.categoryKey){
				this.writeCategoryValue(value);
			};
		};
	},
	removePreviewItem: function(value, filterName){		
		if(value != ""){
			this.$filterNav.find('>.item[data-value="' + value + '"][data-facet="' + filterName + '"]').remove();
		}else{
			this.$filterNav.find('>.item[data-facet="' + filterName + '"]').remove();
		};		
	},
	removeAllPreviewItems: function(){
		this.$filterNav.find(">.item").each(function(){
			$(this).remove();
		});
	},
	addActiveClass: function(elem){
		$(elem).addClass("active");
	},
	removeActiveClass: function(elem){
		$(elem).removeClass("active");
	},
	getCurrentUrl: function(){
		return window.location.href;
	},
	showSubmenu: function(elem){
		facetFilterApp.$categoryDrilldown.foundation("_show", elem);
	},
	getFacetCrontrollerUrl: function(){
		/**
		* creates URL to call facet controller;
		* returns:
		*	facetURL -> URL as String;
		**/
		url = this.getCurrentUrl();
		facetUrl = url.substring(0, url.indexOf("frontend") + 9) + this.facetFilterUrl; //+ 9 to slice after "frontend/" string
		return facetUrl;
	},
	enableApplyButton: function(){
		this.$applyButton.prop("disabled", false);
	},
	disableApplyButton: function(){
		this.$applyButton.prop("disabled", true);
	},
	setAjaxCheckInterval: function(){
		/**
		* hotfix due to long loading times of the facet json;
		* set's an interval to check, whether there are pending ajax requests
		* and enables the form-apply button if not the case
		*/
		if(! this.$ajaxIntervalSet){
			ajaxCheck = setInterval(function(){
				facetFilterApp.$ajaxIntervalSet = true;

				if(! facetFilterApp.hasOpenAjaxRequest() ){

					facetFilterApp.enableApplyButton();
					facetFilterApp.$ajaxIntervalSet = false;
					clearInterval(ajaxCheck);			
				}
			}, this.$ajaxInterval);
			
			ajaxCheck;
		}
	},
	hasOpenAjaxRequest: function(){
		/** 
		* checks if there are open ajax requests pending
		* returns:
		*	boolean -> true or false
		**/
		return $.active > 0 ? true : false;
	}
}
