/* Logaholic Web Analytics software             Copyright(c) 2005-2016 Logaholic B.V.
 *                                                               All rights Reserved.
 * This code is subject to the Logaholic license. Unauthorized copying is prohibited.
 * support@logaholic.com                         http://www.logaholic.com/License.txt
*/ 
var lgtoday = new Date(); 
var lgzero_date = new Date(0,0,0); 
lgtoday.setTime(lgtoday.getTime() - lgzero_date.getTime()); 
var cookie_expire_date = new Date(lgtoday.getTime() + (390 * 86400000));

var lwa_errors = 0;
var lwa_error_msgs = new Array();
var lwa_max_scroll = 0;
var lwa_adBlockEnabled = false;
var lwa_docTitle = document.title;

if (typeof lwa.trackermode == 'undefined') {
	lwa.trackermode = 1;
}

function lg_logAdBlock() {  
  var lwa_ad = document.createElement('div');
  lwa_ad.innerHTML = "&nbsp;";
  lwa_ad.className = "adsbox"; 
  document.body.appendChild(lwa_ad);
  window.setTimeout(function() {
    if (lwa_ad.offsetHeight === 0) {
      lwa_adBlockEnabled = true;
    }
    lwa_ad.remove(); 
  }, 100);
}

function lg_LogJSErrors(msg){
    lwa_errors++;
    lwa_error_msgs.push(msg['message'] + " on line "+msg['lineno']);
    console.log(msg);
    console.log(msg['message'] + " on line "+msg['lineno'] );
};

function lg_logScroll() {
  if (window.scrollY > lwa_max_scroll) {
    lwa_max_scroll = window.scrollY;
  }  
}

function lg_logUnload() {  
  if(lwa_adBlockEnabled == true) {
    adblock='Yes';
  } else {
    adblock='No';
  }
  
  var lg_loadTime = window.performance.timing.domContentLoadedEventEnd-window.performance.timing.navigationStart;
  var lwaurl ="/logaholic.gif?loadtime="+lg_loadTime+"&adblock="+adblock+"&sw="+window.screen.width+"&sh="+window.screen.height+"&vpw="+document.documentElement.clientWidth+"&vph="+document.documentElement.clientHeight+""; 
  
  if (lwa_max_scroll > 0) {
    tot_height = document.body.scrollHeight;
    scroll = lwa_max_scroll + document.documentElement.clientHeight;
    sdepth = parseInt((scroll / tot_height) * 100);
  } else {
    sdepth = 0;
  }
  var pagetime = Date.now()-window.performance.timing.navigationStart;  
  lwaurl = lwaurl + "&pagetime="+pagetime+"&sdepth="+sdepth+"&cd=" + window.screen.colorDepth + "&title="+encodeURIComponent(lwa_docTitle);

  if (lwa.trackermode == 1) {
    var logaholic = "";
    logaholic = "referrer=" + escape(window.document.location) + "&visitorid=" + lggetVisitorID() + "&sessionid=" + lggetSessionID() + "&page=" + encodeURIComponent(lwaurl);   
    lwaurl = lwa.server + 'includes/trackPage.php?conf=auto&lwa_id=' + lwa.id + '&' + logaholic;  
  } else {
    //if we are using log files, just request the page to cause a hit in the log file    
  }
  
  navigator.sendBeacon(lwaurl);  
}

function lgGet_Cookie(name) { 
   var start = document.cookie.indexOf(name+"="); 
   var len = start+name.length+1; 
   if ((!start) && (name != document.cookie.substring(0,name.length))) return null; 
   if (start == -1) return null; 
   var end = document.cookie.indexOf(";",len); 
   if (end == -1) end = document.cookie.length; 
   return unescape(document.cookie.substring(len,end)); 
}
function lgSet_Cookie(name,value,expires,path,domain,secure) { 
    var cookieString = name + "=" +escape(value) + ";path=/" +
       ( (expires) ? ";expires=" + expires.toGMTString() : "") + 
       ( (domain) ? ";domain=" + domain : "") + 
       ( (secure) ? ";secure" : ""); 
    document.cookie = cookieString; 
}
function lggetVisitorID() { 
   if (!lgGet_Cookie('NewLogaholic_VID')) {
       var lgvid = Math.floor(Math.random() * (navigator.userAgent.length * 1000000000));
       lgSet_Cookie('NewLogaholic_VID',lgvid,cookie_expire_date);        
   }  
   return lgGet_Cookie('NewLogaholic_VID'); 
}
function lggetSessionID() { 
   if (!lgGet_Cookie('NewLogaholic_SESSION')) {
       var lgses = Math.floor(Math.random() * (navigator.userAgent.length * 1000000000));
       lgSet_Cookie('NewLogaholic_SESSION',lgses);
       return lgGet_Cookie('NewLogaholic_SESSION') + "&newses=1";        
   } else {
       return lgGet_Cookie('NewLogaholic_SESSION');
   } 
}
function lwaTrackPage() {
    if (lwa.trackermode == 1) {
      var logaholic = "";
      logaholic = "referrer=" + escape(window.document.referrer) + "&visitorid=" + lggetVisitorID() + "&sessionid=" + lggetSessionID() + "&trackermode=" + lwa.trackermode;
      //if(window.screen) {  logaholic +="&w=" + window.screen.width + "&h=" + window.screen.height + "&cd=" + window.screen.colorDepth;  }
      //if(document.title) {  logaholic +="&docTitle=" + escape(document.title);  }
      var logatr = new Image();    
      logatr.src = lwa.server + 'includes/trackPage.php?conf=auto&lwa_id=' + lwa.id + '&' + logaholic + '&rnd=' + Math.random();
      lgdebug = window.location.href;
      if (lgdebug.indexOf("debug=1") > -1) {
          console.log(lwa.server + 'includes/trackPage.php?conf=auto&lwa_id=' + lwa.id + '&' + logaholic);
      }
    }
}
function lwaLogPage(page) {    
    if (lwa.trackermode == 1) {
      var logaholic = "";
      logaholic = "referrer=" + escape(window.document.location) + "&visitorid=" + lggetVisitorID() + "&sessionid=" + lggetSessionID() + "&page=" + page;
      var logatrEvent = new Image();
      logatrEvent.src = lwa.server + 'includes/trackPage.php?conf=auto&lwa_id=' + lwa.id + '&' + logaholic;  
    } else {
      //if we are using log files, just request the page to cause a hit in the log file
      var logatrEvent = new Image();
      logatrEvent.src = page;
    }
    
}

if(typeof lwa.id!='undefined') {  
  if(lwa.action=='trackPage') {    
      lwaTrackPage();
  }
  if (typeof lwa.noadblock == 'undefined') {
    window.addEventListener("load", lg_logAdBlock, false);
  }
  window.addEventListener("unload", lg_logUnload, false);
  window.addEventListener("scroll", lg_logScroll, false);
} else {
  console.log("no config for logaholic tracking");  
}
