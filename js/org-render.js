// This file renders the hybrid ORG/GV/HTML files.
// TODO: Expand this text

// Settings:
'use strict';
var DEBUG=true
var preRendered;
var orgContainer='.org-container'
var orgDefaultHiddenTags=['STATS','AUTO_JS','AUTO_CSS','AUTO_HIDE','CONFIDENTIAL','OLD'];
var localStorageFormatVersion=3;
var cvgAutomaticImageClasses=['RJ45','RJ45U','SFP']
var stdCSS='css/org-view.css';
var optCSS='css/test.css'     // Main CSS File is defined @top of org.htm file
var vizJS='js/viz-full.js'
var vizImagesList='js/viz-images.js';
var orgJS='js/org.js'
var tableSortJS='js/tablesort.bundle.js'
var mathJaxURL= 'https://cdnjs.cloudflare.com/'
              + 'ajax/libs/mathjax/2.7.4/latest.js?config=TeX-MML-AM_CHTML'
var hljs='css/highlight_js/highlight.pack.js';

var arrJSIncludes = [
// ¹st Array element is the source path, ²nd is a comment, ³rd indicates synchronous load
  ['js/tools.js'         , ''                                     , true],
  ['js/lz-string.min.js' , 'Compression/Decompression Library'    , true],
//  [hljs                  , ''                                     , true],
  [orgJS                 , 'Upstream Org-Mode Javascript renderer', false]
];

if (document.getElementById('toolsLibJS')) preRendered=true;
else {
  // Adding necessary charset
  document.head.innerHTML='<meta charset="utf8" />';

  // Initial Script loading:
  arrJSIncludes
    .forEach(e => {
      var sc=document.createElement('script');
      sc.type="text/javascript";
      sc.src=e[0];
      if (e[2]) sc.async=false;
      document.head.appendChild(sc);
    })
}

if (localStorage.getItem('FormatVersion')<localStorageFormatVersion) {
  localStorage.clear();
  localStorage.setItem('FormatVersion',localStorageFormatVersion);
}

// Some tool functions:

function loadJSFile(src, fn_onload, dest=document.head, async=true) {
  var fileref=document.createElement('script');
  fileref.setAttribute("type","text/javascript");
  fileref.onload = fn_onload;
  fileref.onerror = fn_onload;
  if (!async) fileref.async=false;
  fileref.onreadystatechange = fn_onload;
  fileref.setAttribute("src", src);
  dest.appendChild(fileref);
}

async function loadCSSFile(path) {
  info('Loading CSS file "'+path+'"');
  document.head.insertAdjacentHTML('beforeend',
           '<link rel="stylesheet" type="text/css" href="'+path+'">');
}

function optimizeSVG(svg){
  // FixMe: Why do I need this rounding function?
  function round(x){ return x.toFixed(2).replace(/\.0*$/,'') }

  var N='([-\\d.]*)'
  var NP=N + ',' +N
  // Matches first six lines (the extraneous xml header from Viz() svg output)
  var RE_FirstSixLinesXMLPreamble = /(.*[\s\S]){6}/

  // Matches/disects graph title tag to construct ids for svg and top group

  // Straight paths (H,V,D) use this prefix. And def vars for (#) and (#),(#)
  var pathPrefix = '<path( .* )d="M' + NP + 'C';

  // For horizontal paths only the first # (x) changes, easy replace() later:
  var RE_HorizPath = RE(pathPrefix + '(?:'+N+',\\3 ?){3}"(.*)')

  // For vertical paths only the second # (y) changes, easy replace() later:
  var RE_VertPath  = RE(pathPrefix + '(?:\\2,'+N+' ?){3}"(.*)')

  // For diagonals all numbers are different, so capture groups for all of them:
  var RE_DiagPath  = RE(pathPrefix +NP+' '+NP+' '+'(?:'+NP+' ?)+"(.*)')

  // Check, if the 4 given coordinates line up: FixMe: this  is not elegant!
  var isStraightDiagonalLine = function(x1, y1, x2, y2, x3, y3, x4, y4){
      var limit=0.1; var a=Math.abs;
      // FixMe: Where do all the rounding errors needing "limit" come from?
      var g=(x4-x1)/(y4-y1)
      return (g && (a(g-(x2-x1)/(y2-y1))<limit) &&
              (a(g-(x3-x2)/(y3-y2))<limit) && (a(g-(x4-x3)/(y4-y3))<limit));
  }

  // Finally, use this function to output the diagonal line code:
  var RE_DiagPaths__fn = function(all, o,x1,y1,x2,y2,x3,y3,x4,y4,r) {
    return isStraightDiagonalLine(x1,y1,x2,y2,x3,y3,x4,y4)
      ? '<line'+o+'x1="' +x1+'" y1="'+y1+'" x2="'+x4+'" y2="'+y4+'"'+r : all }

  // GV outputs perfect rectangles as <polygon s, so we find and replace them:
  var polygonPrefix='<polygon( .* )points="'+NP+' ';

  // Build "<rect..." after using below REs to extract coords from the polygons
  var rect = function(options, xLeft, yBottom, xRight, yTop, rest){
    return '<rect'+options+'x="'+xLeft+'" y="'+yBottom+'" '
      +'width="'+round(xRight-xLeft)+'" height="'+round(yTop-yBottom)+'"'+rest;}

  // Match rectangles specified as TL - BL - BR -- TR -- TL
  var RE_Rect_TL_BL_BR_TR_TL=
      RE(polygonPrefix + '\\2,'+N+ ' ' +N+',\\4 \\5,\\3 \\2,\\3"(.*)');
  var RE_Rect_TL_BL_BR_TR_TL__fn = function(_, o, xL, yT, yB, xR, r) {
      return rect(o, xL, yB, xR, yT, r);}

  //
  var RE_Rect_BR_BL_TL_TR_BR=
      RE(polygonPrefix +N+',\\3 \\4,'+N+ ' \\2,\\5 \\2,\\3"(.*)');
  var RE_Rect_BR_BL_TL_TR_BR__fn = function(_, o, xR, yB, xL, yT, r) {
      return rect(o, xL, yB, xR, yT, r);}

  svg=
  svg
    .replace(RE_FirstSixLinesXMLPreamble,'')
    // Delete empty groups which were output for hidden edges:
    .replace(/<!--.*-->([\s\S])<g.*<title>.*<.title>\1<.g>\1/g,'')
    // replacing horizontal paths with lines:
    .replace(RE_HorizPath, '<line$1x1="$2" y1="$3" x2="$4" y2="$3" $5')
    //replacing vertical paths with lines:
    .replace(RE_VertPath, '<line$1x1="$2" y1="$3" x2="$2" y2="$4" $5')
    // This finds straight diagonal lines specified as paths.
    .replace(RE_DiagPath, RE_DiagPaths__fn)
    // This finds rectangles specified as TL - BL - BR -- TR - TL
    .replace(RE_Rect_TL_BL_BR_TR_TL, RE_Rect_TL_BL_BR_TR_TL__fn)
    // This finds rectangles specified as BR - BL - TL - TR - BR
    .replace(RE_Rect_BR_BL_TL_TR_BR, RE_Rect_BR_BL_TL_TR_BR__fn)
    //  .replace(/viewBox=".*?" /,'')
    //.replace(/(<g .* class="graph").*>/,'$1>')
    .replace(/(<svg .*)([\s\S])( .*\2)(<g( id=")).*?(".*\2)(<(title>)(.*)<.\8)/
             ,"$1$5svg_$9\"$2$3$4g_$9$6$7")
    // This unwraps groups containing only one element with a title
    .replace(/(<!--.*-->)([\s\S])<g.*<(title>)(.*)<.\3\2(.*)\/>\2<.g>/g
              , '$1$2$5 id="$4" title="$4"/>');
  return svg;
}

function findAndInjectAutoJsCodeFromOrgDoc(orgCode){
  var AutoJsFinder=/^\*+.*:AUTO_JS:[\s\S]*?BEGIN_SRC javascript[\s\S]([\s\S]*?)[\s\S]#\+END_SRC/gm
  var jsCode=orgCode.match(AutoJsFinder);
  if (!jsCode) return false;
  while (jsCode[0]) {
    info('Found Javascript AUTO_JS code:'+"\n"+jsCode[0])
    var geval=eval
    geval(jsCode[0].replace(AutoJsFinder,"$1"));
    jsCode.shift();
  }
}

function findAndInjectAutoCssCodeFromOrgDoc(orgCode){
  var AutoCssFinder=/^\*+.*:AUTO_CSS:[\s\S]*?BEGIN_SRC css[\s\S]([\s\S]*?)[\s\S]#\+END_SRC/gm
  var cssCode=orgCode.match(AutoCssFinder);
  if (!cssCode) return false;
  while (cssCode[0]) {
    console.log('Found CSS AUTO_CSS code:'+"\n"+cssCode[0]);
    var tag=document.createElement('style')
    tag.type='text/css';
    tag.innerHTML=cssCode[0].replace(AutoCssFinder, "$1");
    document.head.appendChild(tag);
    cssCode.shift();
  }
}

function addTopRightDocumentMenu() {
  var headerDiv = document.querySelector(orgContainer).querySelector('h1')
  var optionsDiv = headerDiv.appendChild(document.createElement('div'))
  optionsDiv.className='org-options';
  optionsDiv.innerHTML=''
    +'<label>Menu</label>'
    +'<options>'
    +'<label for="toc-toggle" id="rdToc">TOC</label>&nbsp;'
    +'<label for="secNum-toggle" id="rdSecNum" title="Toggle Section Nr.">'
      + '1.2.</label>&nbsp;'
    +'<tagselect><span>Tags</span><br /><taglist></taglist></tagselect>'
    +'</options>'

}

function L2PostProcess() {
  var orgDiv=document.querySelector(orgContainer)
  var headerDiv = orgDiv.querySelector('h1')
  var checkBox='<input type="checkbox" class="hidden"'

  addTopRightDocumentMenu();

  headerDiv.insertAdjacentHTML('beforebegin',
              checkBox  + ' id="secNum-toggle" name="toggle-secNum"        >'
              + checkBox+ ' id="toc-toggle"    name="toggle-toc"    checked>');

  if (preRendered) {
    var tocDiv = orgDiv.querySelector('h1 ~ div#table-of-contents');
  } else {
    var tocUL = orgDiv.querySelector('h1 ~ ul');
    var tocDiv= orgDiv.insertBefore(document.createElement('div'), (tocUL))
    tocDiv.appendChild(tocUL)
  }
  tocDiv.className='toc';

  Array.from(tocDiv.querySelectorAll('ul>li>a[href^="#head"]~ul'))
    .forEach(e => {
      var li=e.parentNode
      var r=RandID()
      li.insertAdjacentHTML('afterbegin',
        '<input type="checkbox" id="toc-'+r+'" checked>'
        + '<label class="closed" for="toc-'+r+'">▶ </label>'
        + '<label class="open" for="toc-'+r+'">▼ </label>');
    })

//  if (!preRendered)
//    wrapOrgDocumentChapters(orgDiv, orgDiv.querySelector('h2:first-of-type'));

  addTableControls();

  //PostProcessOrgHtmlResult()

  extractTagsFromOrgDoc()

  orgDefaultHiddenTags.forEach(e => {
    var checkBox=document.querySelector('input#tagTog_'+e);
    if(checkBox) checkBox.click();
  });

  if (typeof PostProcess === "function") { PostProcess();
  } else  console.log('No PostProcess function defined');

//}
//function L3PostProcess() {

  //AddDocumentStatistics();

  loadJSFile(vizJS, function(){findAndRenderGraphVizIntoTabGroups()},document.head);

  // If we find MathNotation in the orgcode, we call MathJax
  if (document.ORGCODE.match(/(\$\$.*[\\{^].*\$\$|\\\(.+\\\))/)) {
    loadJSFile(mathJaxURL, function(){});
  }

  makeTablesSortable();
  if(document.body.querySelector('p>code[class^="lang-"],p>code[class^="language-"]')){
    loadJSFile(hljs, function(){hljs.initHighlightingOnLoad();})
  }
  //hljs.initHighlightingOnLoad();
  addPrintPageBreakControls();
}

function PostProcessOrgHtmlResult() {
  var orgDiv=document.querySelector(orgContainer);
  wrapOrgDocumentChapters(orgDiv, orgDiv.querySelector('h2:first-of-type'));
  document.querySelectorAll('code.language-org')
    .forEach(
      e =>
        e.innerText =
        e.innerText
        .replace(/^  ,?/,'')
        .replace(/^,#/g,'#')
        .replace(/([\S\s]),#/g,"$1#")
        .replace(/([\S\s])  ,?/g,"$1"));

  document.querySelectorAll('code.language-svg')
//    .forEach(e => e.classList.value='lang-html '+e.classList.value;);
//  document.querySelectorAll('code.language-svg')
    .forEach(e => {
      e.classList.remove('language-svg')
      e.classList.add('lang-html')
      e.classList.add('language-svg')
    });

  document.querySelectorAll('code.language-emacs-lisp')
    .forEach(e => {
      e.classList.remove('language-emacs-lisp')
      e.classList.add('lang-lisp')
      e.classList.add('language-emacs-lisp')
    });

  fixTableHeads();
}

function fixTableHeads(){
  document.querySelectorAll('table>tbody>tr>th:first-child').forEach(
    e => {
      var tbl=e.parentNode.parentNode.parentNode;
      var thead=tbl.insertBefore(document.createElement('thead'), tbl.firstChild);
      thead.appendChild(e.parentNode);
    });
  document.querySelectorAll('table>tbody>tr:nth-child(10)').forEach(
    e => e.parentNode.parentNode.classList.add('sortable')
  )
}

function addPrintPageBreakControls() {
  var ttip=' title="Click here to force/avoid a printed pagebreak '
                 +'before/after this header" ';
  var html = ' <span class="ForcePageBreakBefore"'+ttip+'>‾</span>'+
           ' <span class="ForcePageBreakAfter" '+ttip+'>_</span>'
  document.querySelectorAll('h2, h3, h4, h5, h6')
    .forEach(e => {
      if (e.childNodes.length>2) e.childNodes[2].insertAdjacentHTML('beforebegin', html)
      else e.insertAdjacentHTML('beforeend',html)
    })
  var togglePageBreaks = function (evSrc){
    var h=this.parentNode;
    if(this.className=='ForcePageBreakBefore'){
      if(h.classList.contains('avoidPageBreakBefore')){
        h.classList.remove('avoidPageBreakBefore'); return true
      }
      if(h.classList.contains('hasPageBreakBefore')){
        h.classList.remove('hasPageBreakBefore');
        h.classList.add('avoidPageBreakBefore'); return true
      }
      if (!h.classList.length) h.classList.add('hasPageBreakBefore')
    }
    if(this.className=='ForcePageBreakAfter'){
      if(h.classList.contains('avoidPageBreakAfter')){
        h.classList.remove('avoidPageBreakAfter'); return true
      }
      if(h.classList.contains('hasPageBreakAfter')){
        h.classList.remove('hasPageBreakAfter');
        h.classList.add('avoidPageBreakAfter'); return true
      }
      if (!h.classList.length) h.classList.add('hasPageBreakAfter')
    }
  }
  document.querySelectorAll('.ForcePageBreakBefore,.ForcePageBreakAfter')
    .forEach(e => e.onclick=togglePageBreaks);
}

async function makeTablesSortable() {
  debug('Running "makeTablesSortable()"')
  var tbls = document.querySelectorAll('table.sortable')
  if(tbls) {
    if(typeof(Tablesort) == 'undefined') {
      loadJSFile(tableSortJS, function(){makeTablesSortable();});
      loadCSSFile('css/tablesort.css');
    } else {tbls.forEach(function (tbl) {new Tablesort(tbl);});}
  } else {
    debug('No sortable Tables found');
  }
}

async function addTableControls() {
  document.querySelectorAll('block_title+table').forEach(e => {
    var titleTag=e.previousSibling;
    var title=titleTag.innerHTML.substring(6)
    if (!e.id) e.id=title;
    var fname='PostProcess_'+e.id
    var cbx = function(id,classes)  { return '<input type="checkbox" '
                           +'id="'+id+'" class="'+classes+'">'; }
    var lbl = function(c, f, l, t, id=null,o=null) { return ' <label for="'+f+'" '+
      'title="Click to '+t+'" class="'+c+'"'+o+'>'+l+'</label>'; }
    var titleID=title+'_'+RandID();
    var tableOrient=title+'_'+RandID();
    titleTag.insertAdjacentHTML('beforeBegin',// cbx(titleID,'ShowBlockTitleForce')
                             //+cbx(tableOrient,'ShowTableTransposed'));
               '<input type="checkbox" id="'+titleID+'" '
                  +'class="ShowBlockTitleForce hidden">'
              +'<input type="checkbox" id="'+tableOrient+'" '
                  +'class="ShowTableTransposed hidden">'
              )
    titleTag.insertAdjacentHTML('beforeEnd',
               ' <label title="Click to turn table to Landscape View" '
               +'class="ShowTableNormal" for="'+tableOrient+'">👤</label>'
              +' <label title="Click to show table in Portrait View" '
                +'class="ShowTableLandscape" for="'+tableOrient+'">👤</label>'
              )
    titleTag.insertAdjacentHTML('afterbegin',
               '<label title="Click to Hide the table name for Printing" '
                +'class="ShowBlockTitle" for="'+titleID+'">🖨</label> '
               +'<label title="Click to Show the table name for Printing" '
	        +'style="text-decoration: line-through;" '
                +'class="HideBlockTitle" for="'+titleID+'">🖨</label> '
              )
    if (typeof window[fname] === 'function') {
      console.log('Running '+fname+' for table.');
      window[fname]();
    }
  //  e.insertBefore(titleTag, e.firstChild)
  })
}

function extractTagsFromOrgDoc() {
// TAGS
  Array.from(document.querySelectorAll('h1,h2,h3,h4,h5'))
  //.filter(e => (ec=e.childNodes)[ec.length-1].textContent.match(/ *:.*:/))
    .filter(e => e.lastChild.textContent.match(/ *:.*:/))
    .forEach(e =>
       e.innerHTML=e.innerHTML
       .replace(/ *:([^ ]*):/,
                function(_,tags) {
                  var p=e.parentNode
                  var res = '<span class="org-taggroup">';
                  tags = tags.split(/\:+/)
                  for (var i=0;i<tags.length;i++){
                    AddToTagList(tags[i]);
                    e.insertAdjacentHTML('beforebegin',
                       '<input type="checkbox" class="hidden toggle" '
                        + 'id="tagTog_'+tags[i]+'_'+RandID()+'" checked>')
                    res+='<tag class="tag-'+tags[i]+'">'+tags[i]+'</tag>'
                  }
                  res+= '</span>';
                  return res;
                })
            )
  Array.from(document.querySelectorAll('a[href^="#head"]'))
    .filter(e => e.lastChild.textContent.match(/[\t ]+:[^ ]*:$/))
    .forEach(
      e => { var txt = e.lastChild.textContent;
             e.lastChild.textContent=
             //txt = txt.replace(/ +:([^ ]*):$/,
             txt.replace(/[\t ]+:([^ ]*):$/,
                         function(_,tags) {
                           //e.insertBefore(toNode() ,e.lastChild)
                           var li=e.parentNode
                           var ul=li.parentNode
                           tags = tags.split(/\:+/)
                           var res = '<span class="org-taggroup">';
                           for (var i=0;i<tags.length;i++){
                             li.insertAdjacentHTML('beforebegin',
                                  '<input type="checkbox" checked '
                                       + 'class="hidden toggle" '
                                       + 'id="tagTog_'+tags[i]+'_'+RandID()+'">');
                             res+='<tag class="tag-'+tags[i]+'">'+tags[i]+'</tag>';
                           }
                           e.appendChild(toNode(res+'</span>'))
                           return '';
                         }
                        )
           }
    )
}

// Document stats
function AddDocumentStatistics() {
  var ds=document.body.querySelector('h2:last-child')
  // TODO: Fix the need for the leading space in the string below
  if (ds.childNodes[1].textContent==' Document Statistics:'){
    var stats=document.createElement('p')
    stats.innerHTML='Document last modified: '+ document.lastModified
                   + '<br />'
                   +'Document rendered at: '
    ds.parentNode.appendChild(stats);
  } else { alert("You removed the 'Document Statistics' Chapter?");}
}

function AddToTagList(tag){
  if (document.getElementById('tagTog_'+tag)) return true;
  var tl=document.querySelector('taglist')
  tl.innerHTML+='<label>'
    +'<input type="checkbox" id="tagTog_'+tag+'" '
          + 'onchange="toggleTagDisplay(this)" checked>'
    +tag+'</label><br />';
}

function toggleTagDisplay(src) {
  var tagVal=(typeof src == "string" ? src : src.parentNode.textContent);
  var qs='input.toggle[id^="tagTog_'+tagVal+'_"]'
  Array.from(document.querySelectorAll(qs)).forEach(
    e => e.checked ^= 1
  )
}

function wrapOrgDocumentChapters(parentDiv, currentElem, level=1){
  var h2=parentDiv.querySelector('h2:first-of-type');
  var index=Array.prototype.indexOf.call(h2.parentNode.childNodes,h2);
  var elem;
  var currentChapter;
  var divID;
  var headerlevel;
  while (elem=parentDiv.childNodes[index]) {
    if (!elem.tagName) headerlevel=0
    else { headerlevel=elem.tagName.match(/[hH]([23456789])/);
           if (headerlevel){headerlevel=headerlevel[1]}}
    if (headerlevel) {
      divID=elem.id.replace(/header/,'chapter')
      elem.outerHTML='<div class="orgChapter" id="'+divID+'">'
                     + elem.outerHTML + '</div>'
      index++
    } else {document.getElementById(divID).appendChild(elem)}
  }
  document.querySelector(orgContainer)
    .querySelectorAll('div.orgChapter[id^="chapter-"]')
    .forEach(e => {
      var mID=e.id.match(/(^.*-[0-9]+)-[0-9]+$/);
      if (mID) document.getElementById(mID[1]).appendChild(e)
    });
}

function drawInNewWindow(targetElem){
    alert(targetElem)
}

function printCurrentGraphView(targetElem){
    alert(targetElem)
}

function findAndRenderGraphVizIntoTabGroups() {
  var db=document.body;
  var elems=db.querySelectorAll('.language-graphviz-dot,.src-graphviz-dot')
  for (var i=0;i<elems.length;i++) {
    var gvCode=(preRendered?elems[i].innerText:elems[i].innerHTML);
    var gName;
    if (gName=/graph ([^ ]*) {/.exec(gvCode)) {
      gName=gName[1]
    }
    var elem=elems[i];
    elem=elem.parentNode;
    var radioPfx='<input type="radio" id="'+gName
    var Pfx='<label for="'+gName
    var liPfx='<li>'+Pfx;
    elem.classList.add('blkGVSRC')
    elem.outerHTML=''
     + '<div class="tabs" id="graphtabs_'+gName+'">'
       + radioPfx +'-svg" class="rdSVG"    name="'+gName+'-g">'
       + radioPfx +'-gv"  class="rdGVSRC"  name="'+gName+'-g" checked>'
       + radioPfx +'-src" class="rdSVGSRC" name="'+gName+'-g">'
       + radioPfx +'-min" class="rdVwMin"  name="'+gName+'-gvo">'//GraphViewOpts
       + radioPfx +'-cen" class="rdVwCen"  name="'+gName+'-gvo">'
       + radioPfx +'-med" class="rdVwMed"  name="'+gName+'-gvo">'
       + radioPfx +'-max" class="rdVwMax"  name="'+gName+'-gvo" checked>'
       + '<tabnav><ul>'
         + '<li title="Print this graph (non-functioning)">'
           + '<span onclick="printCurrentGraphView('+"'"+gName+"'"+')">⎙</span>'
         +'</li><li title="Draw this graph in new window (non-functioning)">'
           +'<span onclick="drawInNewWindow('+"'"+gName+"'"+')"><b>⎘</b></span>'
         + '</li>'
         + '<li title="cycle through view options">'
           +Pfx +'-min" class="lbSzOpt lbSzMin" title="Minimize"     >_</label>'
           +Pfx +'-cen" class="lbSzOpt lbSzCen" title="Center Graph" >C</label>'
           +Pfx +'-med" class="lbSzOpt lbSzMed" title="Fit 2 Page"   >◱</label>'
           +Pfx +'-max" class="lbSzOpt lbSzMax" title="Original Size">M</label>'
         + '</li>'
         + '<li title="Cycle between DOT-source, SVG-source, and Graph">'
         + Pfx +'-src" class="lbVwOpt lbSVGSRC">SVG</label>'
         + Pfx +'-gv"  class="lbVwOpt lbGVSRC" >DOT</label>'
         + Pfx +'-svg" class="lbVwOpt lbSVG"   >🖼</label>'
         + '</li>'
       + '</ul></tabnav>'
       + '<section>'
         + '<div class="blkSVG" id="svg'+gName+'"></div>'
         + (preRendered
            ?'<pre class="prettyprinted blkGVSRC">'
               + '<code id='+elems[i].id+'" '
                    + 'class="lang-bash language-graphviz-dot" >'
                 + elems[i].innerHTML
               + '</code></pre>'
            :elem.outerHTML)
         + '<pre class="prettyprint blkSVGSRC">'
           + '<code class="lang-html language-svg" id="svgsrc-'+gName+'"></code>'
         + '</pre>'
       + '</section>'
     + '</div>'
    RenderGraphvizToSVG(gvCode,gName);
  }
}

function RenderGraphvizToSVG(graphvizCode, destinationElem){
  var gvHash=hash(graphvizCode);
  // TODO: Remove need for ugly hack below. (org.js automatic linking)
  graphvizCode=graphvizCode.replace(/<a href="[^>]*>([^<]*)<\/a>/, "$1")
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>');
  info('Attempting to find SVG-Code for key '+ gvHash + ' in cache');
  var svgContainer=document.querySelector('#svg'+destinationElem);
  var svg=getCacheItem('svgCache_' + gvHash)
  //var svg=LZString.decompress(localStorage.getItem('svgCache_' + gvHash))
  if (!svg) {
    console.log('Not Found: SVG elem ' + gvHash + ' in Cache, attempting re-building')
    if (typeof(MyGVImages) == 'undefined') {
      console.log('Not Found: Viz Image list, loading '+vizImagesList+', then reattempt')
      function fn1(){RenderGraphvizToSVG(graphvizCode, destinationElem);};
      loadJSFile(vizImagesList,fn1);
      return true;
    }
    if (typeof(Viz) == 'undefined') {
      console.log('Not Found: Viz Parser, loading '+vizJS+', then reattempt')
      function fn(){RenderGraphvizToSVG(graphvizCode, destinationElem);};
      loadJSFile(vizJS,fn);
      return true;
    }
    info('Re-building SVG String, and storing in cache item ' + gvHash);
    console.log(graphvizCode)
    svg=optimizeSVG(Viz(graphvizCode, MyGVImages));
    svgContainer.innerHTML='\n'+svg+'\n';
    //localStorage.setItem('svgCache_'+gvHash, LZString.compress(svg));
    document.querySelector('#'+destinationElem+'-svg').checked = true;
    PostProcessSvgStandard('#svg'+destinationElem);
    //storeCacheItem('svgCache_'+gvHash, svg);
    storeCacheItem('svgCache_'+gvHash, svgContainer.innerHTML);
  } else { svgContainer.innerHTML='\n'+svg+'\n'; }

  document.querySelector('#'+destinationElem+'-svg').checked = true;

  if (typeof window['PostProcess_Every_Graph'] === "function") {
    window['PostProcess_Every_Graph'](destinationElem);
  }

  if (typeof window['PostProcess_Graph_'+destinationElem] === "function") {
    window['PostProcess_Graph_'+destinationElem](gvHash);
  } else {
    console.log('No function PostProcess_Graph_'+destinationElem+' defined!')
  }
  var ProcessedSVG=svgContainer.innerHTML
  ProcessedSVG=ProcessedSVG.replace(/^\n/,'').replace(/\n\s*\n/g,"\n");
  var svgSrcContainer=document.querySelector('#svgsrc-'+destinationElem);
  svgSrcContainer.innerText=vkbeautify.xml(ProcessedSVG,'  ');
//  doStandardPostProcess();
  return true;
//  addEventListeners();
}

function PostProcessSvgStandard(svgDest){
  //alert('Called function')
  document.querySelectorAll(svgDest + ' .SFP')
    .forEach(e => {
    var b=e.getBBox();
    console.log(b.x)
    if(!e.querySelector('img')) {
      e.insertAdjacentHTML('beforeend',
           '<image xlink:href="img/SFP.svg" '+
           'x="'+b.x+'" '         + 'y="'+b.y+'" '+
           'width="'+b.width+'" ' + 'height="'+b.height+'" '+ '>')
    }
  })
  document.querySelectorAll(svgDest + ' .RJ45')
    .forEach(e => {
    var b=e.getBBox();
    if(!e.querySelector('image')) {
      e.insertAdjacentHTML('beforeend',
           '<image xlink:href="img/RJ45.svg" '+
           'x="'+b.x+'" '         + 'y="'+b.y+'" '+
           'width="'+b.width+'" ' + 'height="'+b.height+'" '+ '>')
    }
  })
  document.querySelectorAll(svgDest + ' .RJ45U')
    .forEach(e => {
    var b=e.getBBox();
    if(!e.querySelector('img')) {
      e.insertAdjacentHTML('beforeend',
           '<image xlink:href="img/RJ45U.svg" '+
           'x="'+b.x+'" '         + 'y="'+b.y+'" '+
           'width="'+b.width+'" ' + 'height="'+b.height+'" '+ '>')
    }
  })
}

async function cleanOrgCacheItems(exclude){
  console.log('Cleaning old CacheItems')
  var i=0,key;
  while(key=localStorage.key(i++))
    if (key.match(/^orgCache_/) && key!=exclude)
      localStorage.removeItem(key);
}

function RenderOrgToHTML(orgCode){
  var orgHash=hash(orgCode);
  info('Attempting to find HTML-Code for key ' + orgHash + ' in Cache');
  //console.log('Attempting to find HTML-Code for key ' + orgHash + ' in Cache');
  var html = getCacheItem('orgCache_' + orgHash);
  var destDiv= document.querySelector(orgContainer);
  if (!html) {
    cleanOrgCacheItems('orgCache_' + orgHash);
    console.log('Not Found: HTML elems ' + orgHash + ' in Cache, re-building')
    if (typeof(Org) == 'undefined'){
      console.log('Not Found: Org Parser, loading org.js')
      function fn(){RenderOrgToHTML(orgCode);};
      loadJSFile(orgJS,fn,document.head);
      return true;
    }
    console.log('Re-building HTML Code, and storing in cache item ' + orgHash);
    var orgOptions = { headerOffset:              1,
                     exportFromLineNumber:      false,
                     suppressSubScriptHandling: false,
                     suppressAutoLink:          true  };
    var orgResult= (new Org.Parser()).parse(orgCode)
        .convert(Org.ConverterHTML, orgOptions);
    var html = orgResult.toString()
    destDiv.innerHTML=html;
    PostProcessOrgHtmlResult();
    //storeCacheItem('orgCache_'+orgHash, html);
    storeCacheItem('orgCache_'+orgHash, destDiv.innerHTML);
  } else destDiv.innerHTML=html;

  L2PostProcess();
}

async function storeCacheItem(itemName, itemValue) {
  localStorage.setItem(itemName, LZString.compress(itemValue));
}

function getCacheItem(itemName) {
  var val = localStorage.getItem(itemName);
  if (val) {
    localStorage
      .setItem(itemName+'-lastUsed',
	       (new Date().toISOString().slice(0, 16)));
    return LZString.decompress(val);
  }
}

async function extractDocTitleFromOrgAndSet(orgCode) {
  info('Attempting to extract Document title from:\n'+orgCode);
  var orgTitle;
  if (orgTitle=/#\+Title: ([^\n\r]*)/.exec(orgCode)){
    info('Setting Page Title to "'+orgTitle[1]+'"');
    document.title=orgTitle[1];
  } else {
    alert('document title not given!')
  }
}

async function extractDocCSSFromOrgAndLoad(src) {
  var orgCSS,orgCSSFinder;
  loadCSSFile(stdCSS);
  loadCSSFile(optCSS);
  orgCSSFinder=/^#\+HTML_HEAD: (.*?stylesheet.*?css.*?href="(.*?)".*?\/>)/gm ;
  if (orgCSS=orgCSSFinder.exec(src)){
    debug('found HTML HEAD CSS: '+orgCSS[1]);
    alert(orgCSS[2]);
    document.head.insertAdjacentHTML('beforeend', orgCSS[1]);
  }
}

function PostProcessOrgSource(src) {
  // removing the Properties Blocks, until we have good means to render them
  src=src.replace(/:PROPERTIES:([\s\S]*?):END:/g,'')

  var blkTitlesRE=/(\n#\+NAME: )([_a-z0-9A-Z-]*)\n/g
  src=src.replace(blkTitlesRE,"\n#+HTML: <block_title>Name: $2</block_title>\n$1$2\n")

  if (!src.match(/\s\* Document Statistics\S/)) {
    src+="\n\n* Document Statistics :STATS:\n";
  }
  return src
}

//function fetchInclude (match,srcFile,w,srcType){
//  var result= match+"\n";
//  var txt = fetchFileContents(srcFile);
//  if(w == 'src') {
//    result += '#+BEGIN_SRC '+ srcType + "\n" + txt + "\n#+END_SRC\n"
//  } else {
//    if((w == ':minlevel') && (srcType.match(/[1-9]/))){
//      result += txt.replace(/\n\*/g,"\n"+"*".repeat(srcType))
//    } else { result += txt }
//  }
//  return result;
//}

function expandOrgSourceDoc(orgSrc, minLevel=0) {
  // Creating a regex for finding include lines, and a replace function
  // Format either of the 2 following:
  // #+INCLUDE: "Empty.org.htm" src org
  // #+INCLUDE: "Empty.org.htm" :minlevel <Number>
  // TODO: make better regexp
  var orgIncludesRE=/\n#\+INCLUDE: "([^\n\r]*)" ([a-z:]*) ([0-9a-z-]*)/g;
  //var orgSetupFileRE=/\n#\+SETUPFILE: ([^\n\r]*)/g;
  var recFetchInclude = function(match,srcFile,w,srcType) {
    var result= match+"\n";
    loadJSFile(srcFile+'.js');
    var txt = fetchFileContents(srcFile);
    if(w == 'src') {
      result += '#+BEGIN_SRC '+ srcType + "\n" + txt + "\n#+END_SRC\n"
    } else {
      if(txt.match(/#\+Title: ([^\n\r]*)/)){
        txt=txt.replace(/#\+Title: ([^\n\r]*)/,'')
      }
      if((w == ':minlevel') && (srcType.match(/[1-9]/))){
        result += expandOrgSourceDoc(txt, minLevel)
                 .replace(/\n\*/g,"\n"+"*".repeat(minLevel+srcType))
      } else { result += expandOrgSourceDoc(txt, minLevel) }
    }
    return result;
  }
  //var recFetchSetupFile = function(match)
  orgSrc=orgSrc.replace(orgIncludesRE,recFetchInclude);
  return orgSrc;
}

function L1PostProcess(event) {
  var orgIncludes,orgIncludesRE,urlOpts;
  var db=document.body; // conveniance variables
  var dh=document.head;
  var dbc=db.childNodes;
  info('Starting Page Load');

  var org = dbc[0].textContent; // Here we get the Org Doc Title (=First line)
  dbc[0].remove();
  extractDocTitleFromOrgAndSet(org);
  // Retrieving rest of Org Doc Source
  dbc.forEach(e => { if (e.nodeType== 8) org+=e.textContent;
              if (e.nodeType!=1) e.remove();        })
  dbc[0].remove();              // Cleaning up

  db.innerHTML='\n<nav id="navBar"></nav>\n<hr>\n'
    + '<div class="'+orgContainer.substr(1)+'">\n</div>\n';

  extractDocCSSFromOrgAndLoad(org);

  org=expandOrgSourceDoc(org);
  //orgIncludesRE=/\n#\+INCLUDE: "([^\n\r]*)" ([a-z:]*) ([0-9a-z-]*)/g;
  //org=org.replace(orgIncludesRE,fetchInclude);

  findAndInjectAutoJsCodeFromOrgDoc(org);
  findAndInjectAutoCssCodeFromOrgDoc(org);

  document.ORGCODE = org = PostProcessOrgSource(org);

  document.cFileName = location.href.split("/").slice(-1);
  loadJSFile(document.cFileName+'.js',function(){RenderOrgToHTML(org)},dh);

//  loadJSFile('navBar.js',function(){FillNavigationBar();},d.head);
}

// End of function definitions

// Page execution starts here:
if (preRendered) {
  // This is the case, when the HTML Export function of Emacs Org mode was called
  console.log('preRendered');
  document
    .addEventListener("DOMContentLoaded"
                      , function () {
                        document.getElementById('content')
                          .classList.add(orgContainer.substr(1));
                        L2PostProcess();
                        //findAndRenderGraphVizIntoTabGroups();
                     })
} else {
  // This is the case, when the "raw" org file is displayed in the browser, and needs to be rendered by JavaScript
  document.addEventListener("DOMContentLoaded", L1PostProcess);
}
