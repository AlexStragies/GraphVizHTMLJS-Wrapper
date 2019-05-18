// Tool library
'use strict';

// Simple Debug & Info functions
function debug(dText, dLevel, dType, dPrefix='🔧') {
  //dText = (dc=debug.caller+'').substring(0,dc.indexOf('{')) + ' :\n' + dText;
  dText = dPrefix + ' : ' + dText;
  if(1+dLevel<DEBUG)
    if(dType=='g') alert(dText); else console.log(dText);
}

function info(iText, iType) {
  debug(iText,-3,iType, '✪')
}

// Simple (fast) Hashing function
function hash(input){
    var hash = 0;
    for (var i = 0; i < input.length; i++) {
        hash = ((hash<<5)-hash)+ input.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    //return String.substr(hash,1)
    return hash.toString().substring(1)   //String.substr(hash,1)
           .replace(/./g,function(m){return 'ABCDEFGHIJ'.charAt(m);})
}

// Random ID function
function RandID(){ return hash(Math.random()+'')}

// Convert some HTML string to a DOM node
var toNode = html =>
    new DOMParser().parseFromString(html, 'text/html').body.firstChild

// Shortcut for less typing, will hopefully be inlined by the js-optimizer
function RE(RegExpString){return new RegExp(RegExpString,'g');}

function fetchFileContents(fNamePath) {
  info('Fetching File Contents: ' + fNamePath)
  var request = new XMLHttpRequest();
  request.open('GET', fNamePath, false);  // `false` makes the request synchronous
  request.send(null);
  if(request.status === 200) {
    return request.responseText;
  }
}

function fetchIncludeBCKP (match,srcFile,w,srcType){
  var request = new XMLHttpRequest();
  console.log('Fetching Inlude:' + srcFile + ', Type: '+srcType)
  request.open('GET', srcFile, false);  // `false` makes the request synchronous
  request.send(null);
  var result= match+"\n";
  if(request.status === 200) {
    var txt = request.responseText;
    if(w == 'src') {
      result += '#+BEGIN_SRC '+ srcType + "\n" + txt + "\n#+END_SRC\n"
    } else {
      if((w == ':minlevel') && (srcType.match(/[1-9]/))){
        result += txt.replace(/\n\*/g,"\n"+"*".repeat(srcType))
      } else { result += txt }
    }
  }
  return result;
}

function parseQuerystring() {
  return JSON.parse('{"' +
               location.search.substring(1).replace(/&/g, '","').replace(/=/g,'":"') +
               '"}',
               function(key, value) { return key===""?value:decodeURIComponent(value) })
}

// A shortened version of vkBeautify below:
/**
* vkBeautify - javascript plugin to pretty-print or minify text in XML, JSON, CSS and SQL formats.
*
* Version - 0.99.00.beta
* Copyright (c) 2012 Vadim Kiryukhin
* vkiryukhin @ gmail.com
* http://www.eslinstructor.net/vkbeautify/
*
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*
*   Pretty print
*
*        vkbeautify.xml(text [,indent_pattern]);
*        vkbeautify.json(text [,indent_pattern]);
*        vkbeautify.css(text [,indent_pattern]);
*
*        @text - String; text to beatufy;
*        @indent_pattern - Integer | String;
*                Integer:  number of white spaces;
*                String:   character string to visualize indentation ( can also be a set of white spaces )
*
*   Examples:
*        vkbeautify.xml(text); // pretty print XML
*        vkbeautify.json(text, 4 ); // pretty print JSON
*        vkbeautify.css(text, '. . . .'); // pretty print CSS
*
*/

(function() {

function createShiftArr(step) {

	var space = '    ';

	if ( isNaN(parseInt(step)) ) {  // argument is string
		space = step;
	} else { // argument is integer
		switch(step) {
			case 1: space = ' '; break;
			case 2: space = '  '; break;
			case 3: space = '   '; break;
			case 4: space = '    '; break;
			case 5: space = '     '; break;
			case 6: space = '      '; break;
			case 7: space = '       '; break;
			case 8: space = '        '; break;
			case 9: space = '         '; break;
			case 10: space = '          '; break;
			case 11: space = '           '; break;
			case 12: space = '            '; break;
		}
	}

	var shift = ['\n']; // array of shifts
	for(var ix=0;ix<100;ix++){
		shift.push(shift[ix]+space);
	}
	return shift;
}

function vkbeautify(){
	this.step = '    '; // 4 spaces
	this.shift = createShiftArr(this.step);
};

vkbeautify.prototype.xml = function(text,step) {

	var ar = text.replace(/>\s{0,}</g,"><")
				 .replace(/</g,"~::~<")
				 .replace(/\s*xmlns\:/g,"~::~xmlns:")
				 .replace(/\s*xmlns\=/g,"~::~xmlns=")
				 .split('~::~'),
		len = ar.length,
		inComment = false,
		deep = 0,
		str = '',
		ix = 0,
		shift = step ? createShiftArr(step) : this.shift;

		for(ix=0;ix<len;ix++) {
			// start comment or <![CDATA[...]]> or <!DOCTYPE //
			if(ar[ix].search(/<!/) > -1) {
				str += shift[deep]+ar[ix];
				inComment = true;
				// end comment  or <![CDATA[...]]> //
				if(ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1 || ar[ix].search(/!DOCTYPE/) > -1 ) { 
					inComment = false;
				}
			} else
			// end comment  or <![CDATA[...]]> //
			if(ar[ix].search(/-->/) > -1 || ar[ix].search(/\]>/) > -1) { 
				str += ar[ix];
				inComment = false;
			} else
			// <elm></elm> //
			if( /^<\w/.exec(ar[ix-1]) && /^<\/\w/.exec(ar[ix]) &&
				/^<[\w:\-\.\,]+/.exec(ar[ix-1]) == /^<\/[\w:\-\.\,]+/.exec(ar[ix])[0].replace('/','')) { 
				str += ar[ix];
				if(!inComment) deep--;
			} else
			 // <elm> //
			if(ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) == -1 && ar[ix].search(/\/>/) == -1 ) {
				str = !inComment ? str += shift[deep++]+ar[ix] : str += ar[ix];
			} else
			 // <elm>...</elm> //
			if(ar[ix].search(/<\w/) > -1 && ar[ix].search(/<\//) > -1) {
				str = !inComment ? str += shift[deep]+ar[ix] : str += ar[ix];
			} else
			// </elm> //
			if(ar[ix].search(/<\//) > -1) {
				str = !inComment ? str += shift[--deep]+ar[ix] : str += ar[ix];
			} else
			// <elm/> //
			if(ar[ix].search(/\/>/) > -1 ) {
				str = !inComment ? str += shift[deep]+ar[ix] : str += ar[ix];
			} else
			// <? xml ... ?> //
			if(ar[ix].search(/<\?/) > -1) {
				str += shift[deep]+ar[ix];
			} else
			// xmlns //
			if( ar[ix].search(/xmlns\:/) > -1  || ar[ix].search(/xmlns\=/) > -1) { 
				str += shift[deep]+ar[ix];
			}

			else {
				str += ar[ix];
			}
		}

	return  (str[0] == '\n') ? str.slice(1) : str;
}

vkbeautify.prototype.json = function(text,step) {

	var step = step ? step : this.step;

	if (typeof JSON === 'undefined' ) return text;

	if ( typeof text === "string" ) return JSON.stringify(JSON.parse(text), null, step);
	if ( typeof text === "object" ) return JSON.stringify(text, null, step);

	return text; // text is not string nor object
}

vkbeautify.prototype.css = function(text, step) {

	var ar = text.replace(/\s{1,}/g,' ')
				.replace(/\{/g,"{~::~")
				.replace(/\}/g,"~::~}~::~")
				.replace(/\;/g,";~::~")
				.replace(/\/\*/g,"~::~/*")
				.replace(/\*\//g,"*/~::~")
				.replace(/~::~\s{0,}~::~/g,"~::~")
				.split('~::~'),
		len = ar.length,
		deep = 0,
		str = '',
		ix = 0,
		shift = step ? createShiftArr(step) : this.shift;

		for(ix=0;ix<len;ix++) {

			if( /\{/.exec(ar[ix]))  {
				str += shift[deep++]+ar[ix];
			} else
			if( /\}/.exec(ar[ix]))  {
				str += shift[--deep]+ar[ix];
			} else
			if( /\*\\/.exec(ar[ix]))  {
				str += shift[deep]+ar[ix];
			}
			else {
				str += shift[deep]+ar[ix];
			}
		}
	return str.replace(/^\n{1,}/,'');
}

  window.vkbeautify = new vkbeautify();

})();
