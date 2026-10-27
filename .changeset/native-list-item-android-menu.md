---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): ListItem's context menu shows every item on Android

On Android a ListItem `contextMenu` showed in an alert, which keeps only the first three buttons and cannot be dismissed, so Cancel and every item after the third were lost and the person had to pick one. A long press now opens a Material menu with every item, dismissed by back or a tap outside.
