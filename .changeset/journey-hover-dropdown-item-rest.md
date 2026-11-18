---
'@lowdefy/server-dev': patch
---

fix(server-dev): A journey click on a hover dropdown's item no longer opens the dropdown again

antd opens a hover dropdown 0.15 s after the pointer enters its popup. The browser runner clicked an item as soon as the pointer reached it, so the click closed the dropdown before that wait ended and the dropdown then opened again, firing `onOpenChange` with `open: true`. No person clicks that fast. The runner now rests on the item for 200 ms before it clicks, so the dropdown stays closed and the browser run fires the same events as the headless run.
