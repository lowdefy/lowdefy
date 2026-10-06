---
'lowdefy': patch
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix: `lowdefy journeys explore` finds an app error a page raises when it opens

A walk now judges what opening its page caused, such as a failing `onInit` or `onMount` request, with the same checks it runs after each step. Before, such an error gave no finding. The error is a finding at open, it stops the walk, and the explorer saves a screenshot of it. It is proven by a one-step journey on the page, `expect: { visible: <pageId> }`, which fails when the page opens with the same app error, as a refused role is.

A walk also no longer offers a control that a step cannot name: one with no block and no text, such as an icon button outside every block.
