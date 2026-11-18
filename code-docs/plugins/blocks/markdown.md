# @lowdefy/blocks-markdown

Markdown rendering blocks for Lowdefy.

## Blocks

| Block               | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `Markdown`          | Render markdown content                              |
| `MarkdownWithCode`  | Markdown with syntax highlighting                    |
| `DangerousMarkdown` | Markdown with raw HTML, sanitised by DOMPurify first |

All three render with `react-markdown` 10 and `remark-gfm` 4 (DangerousMarkdown adds
`rehype-raw` 7). `react-markdown` takes no `className`, so each block wraps its output in a
`div` that carries the `markdown-body` CSS module class. MarkdownWithCode highlights code
through a `pre` component override: `react-markdown` no longer tells the `code` component
whether code is inline, and block code is the only code inside a `pre`.

## Markdown Block

Renders markdown to HTML:

```yaml
- id: docs
  type: Markdown
  properties:
    content: |
      # Welcome

      This is **markdown** content.

      - Item 1
      - Item 2
```

## MarkdownWithCode Block

Adds syntax highlighting for code blocks:

````yaml
- id: tutorial
  type: MarkdownWithCode
  properties:
    content: |
      # Code Example

      ```javascript
      const hello = 'world';
      console.log(hello);
      ```
````

## Properties

| Property           | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `content`          | Markdown string                                             |
| `skipHtml`         | Drop raw HTML instead of showing it as text (not Dangerous) |
| `DOMPurifyOptions` | DOMPurify options, read once on mount (DangerousMarkdown)   |
