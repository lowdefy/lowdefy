---
'@lowdefy/blocks-tiptap': patch
---

fix(deps): Position the TiptapMentionInput popups with Floating UI instead of tippy.js

The mention list and the group-members popover were tippy.js popups; tippy.js has had no release since 2021. They are now placed with `@floating-ui/dom`, which tiptap 3 itself uses, and the mention list through the suggestion plugin's own mounting. Placement is unchanged: the list opens 10px below the caret and the popover 10px above the chip, both flip to the other side near a viewport edge and stay inside it, and both fade in. Two small differences remain:

- A click outside the mention list now ends the suggestion and removes the list at once, where it used to fade out over 250 ms. A click inside the editor no longer hides the list unless it moves the cursor out of the mention.
- The popups' wrapper elements no longer carry tippy's `data-tippy-root` and `tippy-box` markup. The list renders in a `div.tiptap-mention-popup`, and the popover is the `.tiptap-mention-group-popover` element itself. App styles that targeted the tippy classes need the new ones.
