---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): Show the tick in ticked AgGrid checkboxes

A ticked checkbox in an AgGrid Balham block, including a read-only boolean cell and a row-selection checkbox, showed no tick. The antd theme draws the ticked box in the primary colour, and the Balham block drew the tick in that same colour, so a ticked box read as empty and a read-only one as a plain grey square. The other blocks drew the tick in the background colour, so it turned dark in dark mode. Every AgGrid block now draws a white tick on the primary colour, as antd's Checkbox does.
