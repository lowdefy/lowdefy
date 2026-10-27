---
'@lowdefy/engine': patch
'@lowdefy/client': patch
'@lowdefy/client-native': patch
---

fix(engine): Every mounted copy of a page re-renders when its state changes.

A page context now keeps a set of React updaters per block (`createUpdaters`) instead of one, and each Block component adds its own while mounted and removes it on unmount. A native shell can show one page instance on two screens (in two tabs' stacks, or pushed again over itself); the copy that mounted last no longer takes the other's re-renders.
