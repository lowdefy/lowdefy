<TITLE>
Label
</TITLE>

<DESCRIPTION>

A container that provides a label for a input block. Most input block use Label by default.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "align": {
        "type": "string",
        "enum": ["left", "right"],
        "default": "left",
        "description": "Align label left or right when inline."
      },
      "colon": {
        "type": "boolean",
        "default": true,
        "description": "Append label with colon."
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable to not render a label title."
      },
      "extra": {
        "type": "string",
        "description": "Extra text to display beneath the content - supports html."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
      },
      "title": {
        "type": "string",
        "description": "Label title - supports html."
      },
      "extraStyle": {
        "type": "object",
        "description": "Css style to applied to label extra.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "feedbackStyle": {
        "type": "object",
        "description": "Css style to applied to label feedback.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "span": {
        "type": "number",
        "description": "Label inline span."
      },
      "inline": {
        "type": "boolean",
        "default": false,
        "description": "Render input and label inline."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
