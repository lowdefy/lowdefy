---
'@lowdefy/shell': patch
---

fix(shell): Lowdefy Dev's network injection shows the NoConnection banner.

The banner and the app's `online` and `offline` events read one shell online state, fed by expo-network and by the dev `network` injection. A simulator shares the computer's network, so `inject { kind: network, value: offline }` is now how to see the banner there. Subscribers hear only changes.
