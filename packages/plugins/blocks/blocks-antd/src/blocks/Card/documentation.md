<TITLE>
Card
</TITLE>

<DESCRIPTION>

A Card container places blocks on a white background with a card border.
The Card has `content`, `title` and `extra` areas. The `title` area replaces `properties.title` if defined.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Toggles rendering of the border around the card."
      },
      "hoverable": {
        "type": "boolean",
        "default": false,
        "description": "Lift up when hovering card."
      },
      "headerStyle": {
        "type": "object",
        "description": "Css style to applied to card header.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "bodyStyle": {
        "type": "object",
        "description": "Css style to applied to card body.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "inner": {
        "type": "boolean",
        "default": false,
        "description": "Change the card style to inner."
      },
      "size": {
        "type": "string",
        "enum": ["default", "small"],
        "default": "default",
        "description": "Size of the card."
      },
      "title": {
        "type": "string",
        "description": "Title to show in the title area - supports html. Overwritten by blocks in the title content area."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Trigger actions when the Card is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
