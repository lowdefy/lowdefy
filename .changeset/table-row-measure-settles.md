---
'@lowdefy/blocks-table': patch
---

fix(blocks-table): Row measuring settles when a row's height reads 1px differently

A table with a wrapped column or detail rows re-measures its rows after every render. A row whose
height rounded to a different pixel between renders moved the window and re-measured again, until
React aborted with error #185 and the block's error boundary replaced the table. The table now
ignores a difference of 1px or less on a row it has already measured. Larger changes (wrapping,
detail rows, resizing) still update the row offsets.
