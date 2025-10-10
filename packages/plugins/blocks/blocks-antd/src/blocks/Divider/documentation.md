<TITLE>
Divider
</TITLE>

<DESCRIPTION>

A divider line. Can be used horizontally or vertically.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "dashed": {
        "type": "boolean",
        "default": false,
        "description": "Whether line is dashed."
      },
      "orientation": {
        "type": "string",
        "default": "center",
        "enum": ["left", "right", "center"],
        "description": "Position of title inside divider."
      },
      "title": {
        "type": "string",
        "description": "Divider title - supports html."
      },
      "type": {
        "type": "string",
        "default": "horizontal",
        "enum": ["horizontal", "vertical"],
        "description": "Direction type of divider"
      },
      "plain": {
        "type": "boolean",
        "default": false,
        "description": "Show text as plain style."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
