<TITLE>
Spinner
</TITLE>

<DESCRIPTION>

A loading spinner. Can be used as a display block, or as container wrapping another block, with the `spinning` property set in `state`.

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
        "description": "Css style object to apply to the icon.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "size": {
        "type": "string",
        "description": "Size of the icon spinner.",
        "enum": ["small", "medium", "large"]
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
