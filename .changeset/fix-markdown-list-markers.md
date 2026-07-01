---
'@lowdefy/blocks-markdown': patch
---

fix(blocks-markdown): Restore list markers on top-level lists.

Numbered and bulleted lists rendered without their `1.`/`•` markers. The block's stylesheet only
assigned a `list-style-type` to nested lists, so top-level `ol`/`ul` fell through to the Tailwind
preflight reset (`list-style: none`) and showed no marker. Gave top-level `ol`/`ul` an explicit
`decimal`/`disc` marker.
