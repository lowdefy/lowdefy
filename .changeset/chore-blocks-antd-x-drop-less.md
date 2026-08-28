---
'@lowdefy/blocks-antd-x': patch
---

chore(blocks-antd-x): Drop the last LESS file and the vestigial `meta.styles` field.

`AgentConversations/style.less` was empty and unused, and `meta.styles` (the old block-meta format,
superseded in v6 by `cssKeys` and direct CSS imports) is not read by the build. Removed the file
and the `styles` key from the `AgentChat` and `AgentConversations` metas. No behaviour change.
