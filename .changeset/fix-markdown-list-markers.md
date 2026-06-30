---
'@lowdefy/blocks-markdown': patch
---

fix(blocks-markdown): Restore list markers and indentation on top-level lists.

Numbered and bulleted lists rendered without their `1.`/`•` markers and with no indent. The block's
stylesheet set `padding-left: 0` and only assigned a `list-style-type` to nested lists, so top-level
`ol`/`ul` fell through to the Tailwind preflight reset (`list-style: none`). Restored `padding-left`
and gave top-level `ol`/`ul` an explicit `decimal`/`disc` marker.
