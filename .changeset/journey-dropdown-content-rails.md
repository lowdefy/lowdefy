---
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless): Rail a DropdownMenu content click on the dropdown too, and leave unmodelled grid methods to the browser

Data-set journeys check a click in a DropdownMenu's content against the rails on both the block the click lands on and the dropdown, whose `onOpenChange` the click fires. The browser and headless runners now check the same blocks. Headless, a `CallMethod` with a Table or AgGrid method the stand-in does not model (such as `scrollToRow`, `clearFilters` or `sizeColumnsToFit`) runs the journey in a browser and names the method, instead of failing.
