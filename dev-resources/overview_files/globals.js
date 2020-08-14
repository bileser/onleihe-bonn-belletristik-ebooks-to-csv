function disableBtn(elementId, count) {
	try {
		//noch aktive button
		var btn = document.getElementById(elementId + count);
		
		if(btn != null) {			
			//activate processMsg box (show img und msg)			
			if (document.getElementById("processMsg" + count) != null) {
				setTimeout("document.getElementById('processMsg" + count + "').style.display='block'", 100);											
			}
			//activate process-msg item (show img only), used in detail view
			if (document.getElementById('process-msg-item') != null) {
				setTimeout("document.getElementById('process-msg-item').style.display='block'", 100);							
			}
					
			//create and add div-element as new button without function, in place of disabled btn
			var btnDiv = document.getElementById("btn-div" + count);
			if(btnDiv != null) {				
				//disable the function button
				btn.style.display = "none";			
				
				var ovlDiv = document.createElement("div");
				
				var styleClass = document.createAttribute("class");				
				styleClass.nodeValue = "anchor";				
				ovlDiv.setAttributeNode(styleClass);
				
				//this property isn't valid for firefox
				var disabl = document.createAttribute("disabled");
				disabl.nodeValue = "disabled";
				ovlDiv.setAttributeNode(disabl);
				
				//disable effect for firefox				
				ovlDiv.style.fontStyle="italic";
				ovlDiv.style.textShadow="1px 1px silver";
								
				var text = btn.innerHTML.length>0?btn.innerHTML:btn.value;
				ovlDiv.innerHTML = text;
				
				btnDiv.appendChild(ovlDiv);			
			}
		}
	} catch (e) {
		alert(e);
	}
}


function processMsg () {
	if(document.getElementById('processMsg') != null) {
		document.getElementById('processMsg').style.display='block';
		setTimeout("document.getElementById('processMsg').style.display='none'", 10000);
	}
}

function visibleElement(elementId, count) {
	try {
	
		if(document.getElementById(elementId + count) != null) {	
			//document.getElementById(elementId + count).style.display='block';
			setTimeout("document.getElementById('" + elementId + count + "').style.display='block'", 100);			
		}		
		
	} catch (e) {}
}

function invisibleElements(elementSize, elementId) {
	try {
		pos = 0;
		while(pos<elementSize){
			if(document.getElementById(elementId+pos) != null) {	
				document.getElementById(elementId+pos).style.display='none';
			}
			pos=pos+1;
		}
	} catch (e) {
	}
}




function setContentOnPageload(elementNr) {
	
	if(document.getElementById('preview-row' + elementNr) != null &&
	   document.getElementById('full-content-row' + elementNr) != null &&
	   document.getElementById('link-row' + elementNr) != null) {
	   
		//set style
		document.getElementById('preview-row' + elementNr).style.display='block';
		document.getElementById('full-content-row' + elementNr).style.display='none';
		document.getElementById('link-row' + elementNr).style.display='block';		
	}
}


function displayContent(elementNr, more, less) {
	if(document.getElementById('link-more' + elementNr) != null && 
		document.getElementById('link-more' + elementNr).firstChild != null &&
		document.getElementById('full-content-row' + elementNr) != null) {
		
		//show full-content-row
		if(document.getElementById('link-more' + elementNr).firstChild.nodeValue==more) {
			
			document.getElementById('full-content-row' + elementNr).style.display='block';
						
			document.getElementById('link-more' + elementNr).firstChild.nodeValue=less;
			
		} else {//show preview
			
			document.getElementById('full-content-row' + elementNr).style.display='none';
			
			document.getElementById('link-more' + elementNr).firstChild.nodeValue=more;
		}
	}
}

function absLeft(el) {
	return (el.offsetParent)?
			el.offsetLeft+absLeft(el.offsetParent) : el.offsetLeft;
}

function absTop(el) {
	return (el.offsetParent)?
			el.offsetTop+absTop(el.offsetParent) : el.offsetTop;
} 


function SendForm() {
	document.selectLangForm.submit();
}

function displayContentByElementId(element) {
	
	 var x = document.getElementById(element);
	 if(x != null) {
	    if (x.style.display == 'none') {
	        x.style.display = 'block';
	    } else {
	        x.style.display = 'none';
	    }
	 }   	
}

function displayContentByElementIdAndValue(element, value) {
	
	 var x = document.getElementById(element);
	 if(x != null) {
	   x.style.display = value;	    
	 }   	
}
