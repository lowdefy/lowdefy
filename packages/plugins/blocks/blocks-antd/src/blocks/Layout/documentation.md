<TITLE>
Layout
</TITLE>

<DESCRIPTION>

The `Layout` block provides a page container for a [layout](https://4x.ant.design/components/layout/) area with content. It can be used as a wrapper, in which `Header`, `Sider`, `Content,` `Footer` or `Layout` itself can be nested.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "style": {
        "type": "object",
        "description": "Css style object to applied to layout.",
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

### Layout, Header-Content-Footer

```yaml
id: layout_example
type: Layout
style:
  textAlign: center
blocks:
  - id: header
    type: Header
    blocks:
      - id: Title
        type: Title
        properties:
          content: Header
        style:
          backgroundColor: red
  - id: content
    type: Content
    blocks:
      - id: Title
        type: Title
        properties:
          content: Content
        style:
          backgroundColor: green
  - id: footer
    type: Footer
    blocks:
      - id: Title
        type: Title
        properties:
          content: Footer
        style:
          backgroundColor: blue
```

</EXAMPLES>
