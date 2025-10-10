<TITLE>
MarkdownWithCode
</TITLE>

<DESCRIPTION>

Render markdown content with code highlighting support. Currently, the following languages are supported:
- HTML: `html`
- Java: `java`
- Javascript: `javascript`, `js`, `jsx`
- JSON: `json`
- Markdown: `markdown`
- Nunjucks: `nunjucks`
- Python: `python`, `py`,
- Typescript: `typescript`, `ts`,
- XML: `xml`
- YAML: `yaml`

> For more details on markdown syntax see: [Markdown cheat sheet](https://guides.github.com/features/mastering-markdown/).

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string",
        "description": "Content in markdown format.",
        "docs": {
          "displayType": "text-area"
        }
      },
      "skipHtml": {
        "type": "boolean",
        "default": false,
        "description": "By default, HTML in markdown is escaped. When true all HTML code in the markdown will not be rendered."
      },
      "style": {
        "type": "object",
        "description": "Style to apply to Markdown div.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
