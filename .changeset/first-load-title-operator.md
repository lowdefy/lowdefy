---
'@lowdefy/server': patch
'@lowdefy/server-e2e': patch
---

fix(server): A page whose `title` is an operator no longer loads with "[object Object]" as its title

The server writes the page's `title` into the first-load HTML. A title written as an operator, such as `_state`, is only evaluated in the browser, so the server wrote the operator object, which showed as "[object Object]" in the browser tab until the page loaded. The server now writes the page id in that case, and the browser replaces it with the evaluated title.
