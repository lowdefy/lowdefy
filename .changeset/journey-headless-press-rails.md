---
'@lowdefy/journey-headless': patch
'@lowdefy/server-dev': patch
---

fix(journey-headless): Headless press rails match the browser's

On a data-set journey, a headless `press` (Enter in the input filled last) is now checked against the blocks the browser checks: the input, each block around it up to an enclosing Modal, Drawer or ConfirmModal, and each shown block whose event `shortcut` Enter fires. Before, headless checked only the input, so it ran a press the browser refused. `pressFiresShortcut` moves to `@lowdefy/journey-headless`, which both runners use.
