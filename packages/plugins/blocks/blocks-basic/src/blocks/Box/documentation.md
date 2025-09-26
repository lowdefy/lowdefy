<TITLE>
Box
</TITLE>

<DESCRIPTION>

A Box is a container that places sub-blocks into a html `<div>`.
The Box has a single area, `content`.

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
        "description": "Box content string. Overrides the \"content\" content area."
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to Box div.",
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
        "description": "Trigger actions when the Box is clicked."
      },
      "onPaste": {
        "type": "array",
        "description": "Trigger actions when the element is focused and a paste event is triggered."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
