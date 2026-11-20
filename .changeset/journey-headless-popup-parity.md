---
'@lowdefy/journey-headless': patch
---

fix(journey-headless): Headless popups and dropdowns fire what the browser fires

- A `Modal` or `Drawer` with `destroyOnHidden` mounts its content again on each open, firing its blocks' `onMount`, unless `forceRender` keeps it drawn.
- A click on a block inside a `DropdownMenu`'s content also clicks the dropdown's trigger: a hover dropdown opens, and a click dropdown toggles. When the clicked block's `onClick` handles the click, the dropdown's `onOpenChange` does not run for it, as in the browser.
- A click on a `DropdownMenu` lands on the first control in its content and fires its `onClick`.
- A `ColorSelector` fill clicks the picker first, so it closes another open dropdown and opens a hover dropdown that holds the picker.
- `open` on a dropdown that is already open fails, as the browser's does.
