---
'@lowdefy/server-dev': patch
---

fix(server-dev): a journey `containing` target matches the text as the page shows it

A `containing` target now matches an element whose shown text contains the string, even when
the words sit in separate elements that only layout separates, such as a label and value in a
flex row or table cells. Before, `<span>Assigned to</span><b>Jane</b>` read as
"Assigned toJane" and `containing: Assigned to Jane` matched nothing. The innermost matching
element is picked, so a target with no `nth` still names one element.
