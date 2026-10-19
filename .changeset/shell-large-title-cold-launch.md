---
'@lowdefy/shell': patch
---

fix(shell): Open a Screen with a large title expanded

Before a page is first drawn, the shell sets the bar its config gives (a literal `largeTitle`, `headerSearch`, `title`, `presentation` and `backgroundTint`) and waits a frame. iOS keeps a large title collapsed when the page's scroll view was first laid out under a standard bar, and the Screen only reports its options once it renders inside that scroll view, so a cold launch opened My work with its large title collapsed.
