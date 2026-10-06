---
'@lowdefy/client': patch
---

fix(client): The page title follows state changes after the page has loaded

The page's `title` was rendered beside the page block, so it kept the value it had at first render: a title read from state that an `onMount` request or a later action set stayed at its fallback until something else re-rendered the page, such as a navigation. The title now renders with the page block, so it changes whenever the page block's properties do, and each page instance shows its own title.
