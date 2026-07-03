---
'@lowdefy/blocks-tiptap': patch
---

fix(blocks-tiptap): Restore editor formatting that appeared stripped.

Lists, blockquotes, headings, code, horizontal rules and line breaks rendered as flat, unstyled text in the TipTap editor because the global antd reset flattened their styles (the underlying HTML was always intact). The editor now restores correct rendering for all of these, themed to match the active antd theme. Applies to both `TiptapInput` and `TiptapMentionInput`.
