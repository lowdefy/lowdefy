---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
---

feat(blocks-native): Native Markdown block

`@lowdefy/blocks-native` now carries a read-only `Markdown` block that draws GitHub-flavoured markdown with React Native views: headings, emphasis, strikethrough, inline and fenced code, block quotes, ordered, unordered and task lists, tables, images and links.

- It takes the web `Markdown` block's `content` and `skipHtml`, so a page in both `pages` and `mobile.pages` can use it. Raw HTML shows as text, as the web block escapes it, and `skipHtml: true` leaves it out.
- A new `onLinkPress` event receives the pressed link's `href` as `_event: href`, and the block does not open the link. Without the event, a link opens in the system browser.
- Text, headings and code take the app's computed antd tokens in light and dark mode.
- It draws with `react-native-marked`, which is plain JavaScript. It needs no native module beyond the `basic` shell profile.
