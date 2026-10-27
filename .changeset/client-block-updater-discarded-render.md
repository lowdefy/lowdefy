---
'@lowdefy/client': patch
'@lowdefy/client-native': patch
---

fix(client): A block render React throws away no longer keeps its updater

A block registers its updater on render, as the engine can update it before its first commit, but only an unmount removed it. A render React discarded, such as a subtree a parent error boundary throws away, kept its updater until the page context was rebuilt. A render's registration now removes itself when no commit follows within a second, and a first commit later than that re-renders once to catch up. The native renderer's blocks do the same.
