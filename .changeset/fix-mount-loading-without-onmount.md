---
'@lowdefy/client': patch
---

fix(client): Blocks without an onMount event no longer render as loading when they mount.

Every block started out loading until its onMount event had run, even when it had none, so a Button that appeared after the page's first render (inside a Box whose `visible` turned true, or in a list row) drew disabled for its first frame and faded in from the disabled colour, and a click in that frame was lost. Only blocks with an onMount event now render as loading while it runs, and their children inherit that loading as before.
