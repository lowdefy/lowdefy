---
'@lowdefy/block-utils': patch
'@lowdefy/blocks-basic': patch
'@lowdefy/blocks-antd': patch
---

fix(blocks): Clicks inside a Modal or Drawer no longer fire the parent block's onClick

React bubbles events through the component tree, so a click inside a Modal, Drawer or dropdown also reached the Box, Card, Span or Dynamic block that contained it in config, even though the popup renders elsewhere in the document. A Modal placed in a clickable Box that opens it would reopen as soon as its Cancel, OK or close button was clicked. These blocks now fire `onClick` (and Box `onPaste`) only for events from DOM they contain, using the new `isEventFromDomDescendant` helper from `@lowdefy/block-utils`. Fixes #1188.
