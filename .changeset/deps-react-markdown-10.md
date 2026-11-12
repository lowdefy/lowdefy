---
'@lowdefy/blocks-markdown': major
---

fix(deps)!: Update react-markdown to 10.1.0, remark-gfm to 4.0.1 and rehype-raw to 7.0.0

The `Markdown`, `MarkdownWithCode` and `DangerousMarkdown` blocks now render with react-markdown 10 and the current unified, micromark and GFM packages. No config changes are needed: the blocks' properties are unchanged, and none of the react-markdown options that were removed (`linkTarget`, `transformLinkUri`, `transformImageUri`) were exposed. Headings, lists, tables, task lists, autolinks, strikethrough, links, images and raw HTML render the same as before. These differences are visible:

- **Code blocks in `MarkdownWithCode` sit in one `pre` element instead of a `pre` inside another `pre`.** Highlighting and colours are unchanged. A code block that is the first or last thing in the block no longer adds an extra 1em of space above or below it, so a block that holds only a code block lines up with the `Markdown` block. Fenced code without a language and indented code are still highlighted, and inline code is still plain.
- **`MarkdownWithCode` no longer writes a stray `node="[object Object]"` attribute** on code elements, and code without a language no longer gets a `language-undefined` class.
- **Footnote back-links are labelled for screen readers as "Back to reference 1", "Back to reference 1-2"** and so on, as on GitHub, instead of "Back to content" on every link.
- The `markdown-body` class is on a `div` the block renders around the markdown, in the same place as before, so CSS that targets the block's markdown still applies.
