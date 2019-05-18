# ORGJS-Wrapper
ORG-JS Wrapper is javascript wrapper around some preexisting Javascript libraries that can render ORG files with embedded objects of various types.

Features include:

- Renders ORG code with org.js
- Renders embedded graphviz with viz.js
- Renders Math with mathjax
- All tables are sortable, and can be rotated clientside
- Various print output options with runtime-chooseable CSS-hacks.
- Syntax highlighting for several languages
- Output is cached compressed to speed up rendering on future loads
- Cleans the SVG a bit too
- Easily add interactivity and active datasources with Javascript embedded in the org
- Chapters can be hidden/shown depending on tags


Uses:
LZ-String from https://github.com/pieroxy/lz-string
Org.js from https://github.com/mooz/org-js
tablesort from (i think) https://github.com/tristen/tablesort
viz.js from https://github.com/mdaines/viz.js/


I'm uploading cleaned bits of this as I find time, so WIP.

(Note, I'll add links to the source repos for the used ones soon too)