---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Long cell text ends in an ellipsis

Text wider than its column was cut off mid-word in every AgGrid block. It now ends in "…", in
plain columns, columns with a `cellRenderer`, `link` cells and checkbox columns.
