# @lowdefy/blocks-markdown

Markdown rendering blocks for Lowdefy.

## Blocks

| Block              | Purpose                           |
| ------------------ | --------------------------------- |
| `Markdown`         | Render markdown content           |
| `MarkdownWithCode` | Markdown with syntax highlighting |

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

| Property     | Purpose                             |
| ------------ | ----------------------------------- |
| `content`    | Markdown string                     |
| `skipHtml`   | Disable raw HTML in markdown        |
| `linkTarget` | Default link target (\_blank, etc.) |
