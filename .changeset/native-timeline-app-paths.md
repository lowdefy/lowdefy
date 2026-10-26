---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): ActivityTimeline opens an app path in a comment as a page

Without `onLinkPress`, a link to an app path in a comment (`[the order](/orders/42)`) opened the app's web page in the browser, where the person is not signed in. It now opens the page in the app through the Link action, as the Markdown block and AgentChat do.
