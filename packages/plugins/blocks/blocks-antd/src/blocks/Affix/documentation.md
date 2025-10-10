<TITLE>
Affix
</TITLE>

<DESCRIPTION>

An Affix block makes it's content stick to the viewport.
The Affix has a single area, `content`.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "offsetBottom": {
        "type": "number",
        "description": "Offset from the bottom of the viewport (in pixels)."
      },
      "offsetTop": {
        "type": "number",
        "description": "Offset from the top of the viewport (in pixels)."
      },
      "style": {
        "type": "object",
        "description": "Css style object to applied to affix.",
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
      "onChange": {
        "type": "array",
        "description": "Triggered when container affix status changes."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
