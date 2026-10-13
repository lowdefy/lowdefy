---
'@lowdefy/helpers': patch
'@lowdefy/engine': patch
'@lowdefy/client': patch
'@lowdefy/block-utils': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-tiptap': patch
---

Allow only safe link schemes in block hrefs

An `href` is used only when its scheme is one DOMPurify allows by default (`http`, `https`, `ftp`, `ftps`, `mailto`, `tel`, `callto`, `sms`, `cid`, `xmpp`, `matrix`), or it is a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders no link. This applies to `Button`, `Tag` and `FloatButton`, the url cell of table, AgentChat message and tool result links, `TiptapMentionInput` mention links, and every `href` given to the Lowdefy `Link` component, which covers table and ag-grid link, avatar and relation cells. A `Link` whose `href` is refused renders a span without navigating, and does not fall back to its `pageId` or `url`; the `Link` action with such an `href` throws "Invalid Link: no target resolved." as it does for a `url` it cannot resolve.

`@lowdefy/helpers` exports the check as `getSafeHref(href)`, which returns the href or `undefined`; `@lowdefy/block-utils` re-exports it.
