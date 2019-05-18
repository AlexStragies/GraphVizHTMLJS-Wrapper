# ORGJS-Wrapper
ORG-JS Wrapper is Javascript wrapper around some preexisting Javascript libraries that can render [org](https://github.com/abo-abo/org-mode)-files with embedded objects of various types.

Main rendering is done by [org.js](https://github.com/mooz/org-js), then embedded objects are rendered/animated.

Features include:

- Renders embedded [Graphviz](https://www.graphviz.org/) with [viz.js](https://github.com/mdaines/viz.js/)
- Renders Math markup with [MathJax](https://www.mathjax.org/)
- All tables are sortable, and can be rotated clientside
- Various print output options with runtime-chooseable CSS-hacks.
- Syntax highlighting for several languages
- Output is cached compressed to speed up rendering on future loads
- Cleans the SVG a bit too
- Easily add interactivity and active datasources with Javascript embedded in the org
- Chapters can be hidden/shown depending on tags

How to use:
- Clone repo
- copy Empty.org.htm to NewName.org.htm
- edit NewName.org.htm, and view in Browser
- Template.org.htm has more complete examples and explanation

(No Emacs needed, but recommended)


Also Uses:
- LZ-String from https://github.com/pieroxy/lz-string
- tablesort from (i think) https://github.com/tristen/tablesort
- something called (iirc) vkbeautify


I'm uploading cleaned bits of this as I find time, so WIP.

(Note, I'll add links to the source repos for the used ones soon too)