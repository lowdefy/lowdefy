---
'@lowdefy/block-utils': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-antd-x': patch
'@lowdefy/blocks-aggrid': patch
'@lowdefy/blocks-tiptap': patch
---

Allow only safe link schemes in block hrefs

`Button`, `Tag` and `FloatButton`, table link, avatar, relation and url cells, ag-grid link cells, AgentChat message and tool result links, and `TiptapMentionInput` mention links now use an `href` only when it is an `http`, `https`, `mailto` or `tel` URL, a relative path, a query or a fragment. Any other value, including one with leading whitespace or control characters, renders the element without a link. A table or ag-grid link whose `href` is refused no longer falls back to its `pageId`.

`@lowdefy/block-utils` exports the check as `getSafeHref(href)`, which returns the href or `undefined`.
