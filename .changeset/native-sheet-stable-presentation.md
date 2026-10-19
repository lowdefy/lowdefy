---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): A tap on a sheet straight after its content changes is no longer dropped

On iOS, a Sheet or a picker sheet that was drawn again (a MultipleSelector toggle, or a block in the sheet changing) passed its sheet a new background style and detents, which re-applied the sheet's presentation and cancelled the next touch for about half a second. The sheet now keeps the same props while they are unchanged, so tapping Done or a row right after a toggle works.
