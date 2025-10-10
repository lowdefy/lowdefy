<TITLE>
Header
</TITLE>

<DESCRIPTION>

The `Header` block provides a page container for a [header](https://4x.ant.design/components/layout/) area with content.

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
        "description": "Css style object to applied to header.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "theme": {
        "type": "string",
        "enum": ["light", "dark"],
        "default": "dark",
        "description": "Page theme."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
