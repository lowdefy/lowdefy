<TITLE>
Span
</TITLE>

<DESCRIPTION>

A Span is a container that places sub-blocks into a html `<span>`.
The Span has a single area, `content`.

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
        "description": "Span content string. Overrides the \"content\" content area."
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to Span div.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Trigger actions when the Span is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
