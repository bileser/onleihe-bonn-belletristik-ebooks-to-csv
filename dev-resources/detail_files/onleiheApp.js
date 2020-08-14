var onleiheApp = {
	/**
	* Frameworks used:
	* 	JQuery v3.3.1 (https://jquery.com/)
	*	selectize.js v0.12.6 (https://github.com/selectize/selectize.js)
	*	foundations.js v6.5.1 (only drilldown and needed components) (https://foundation.zurb.com/)
	*
	* this App handles all javascript functions regarding to the onleihe;
	* the App is build in a way, that all functions can be called outside from this App to be reusable;
	* 
	* @author: Mark Engelhard - Smaser AG - 2020
	**/

	/**
	* initial variables;
	**/
	init: function(){

		/**
		*	init variables;
		**/
		this.$cookiePrivacyStatement = $(".cookiePrivacy");
		this.$cookiePrivacyStatementButton = $(".cookiePrivacy .button");

		$(function() {
			$(document).foundation();
		});
		this.checkCookiePrivacyStatement();
		this.bindEventlisteners();
	},
	bindEventlisteners: function(){
		this.$cookiePrivacyStatementButton.click(function(){
			onleiheApp.setCookie("cookiePrivacy", true);
			onleiheApp.hideCookiePrivacyStatement();
		});
	},
	checkCookiePrivacyStatement: function(){
		if(! this.checkCookie("cookiePrivacy") ){
			onleiheApp.showCookiePrivacyStatement();
		};
	},
	showCookiePrivacyStatement: function(){
		this.$cookiePrivacyStatement.show();
	},
	hideCookiePrivacyStatement: function(){
		this.$cookiePrivacyStatement.hide();
	},
	checkCookie: function(cookieName){
		var cookie = onleiheApp.getCookie(cookieName);
		
		if(cookie != ""){
			return true;
		}else{
			return false;
		};
	},
	getCookie: function(cookieName){
		var name = cookieName + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
			  c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
			  return c.substring(name.length, c.length);
			}
		}
		return "";
	},
	setCookie: function(cookieName, data){
		var d = new Date();
		d.setTime(d.getTime() + (10000*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cookieName + "=" + data + ";" + expires + ";path=/" + document.URL.split("/")[3];
	}
}