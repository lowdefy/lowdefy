<TITLE>
Badge
</TITLE>

<DESCRIPTION>

Small numerical value or status descriptor for UI elements. Badge is used as a container block, describing its content block.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "color": {
        "type": "string",
        "description": "Customize Badge dot color.",
        "docs": {
          "displayType": "color"
        }
      },
      "count": {
        "type": ["number", "string"],
        "description": "Text to show in badge.",
        "docs": {
          "displayType": "string"
        }
      },
      "dot": {
        "type": "boolean",
        "default": false,
        "description": "Whether to display a red dot instead of count."
      },
      "size": {
        "type": "string",
        "default": "default",
        "enum": ["default", "small"],
        "description": "Sets the size of badge if count is set."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in badge.",
        "docs": {
          "displayType": "icon"
        }
      },
      "offset": {
        "type": "array",
        "items": { "type": "number" },
        "description": "Set offset of the badge dot, array of numbers for x and y offset ([x,y])."
      },
      "overflowCount": {
        "type": "number",
        "default": 99,
        "description": "Max count to show"
      },
      "showZero": {
        "type": "boolean",
        "default": false,
        "description": "Whether to show badge when count is zero."
      },
      "status": {
        "type": "string",
        "enum": ["success", "processing", "default", "error", "warning"],
        "default": null,
        "description": "Set Badge as a status dot."
      },
      "text": {
        "type": "string",
        "description": "If status is set, text sets the display text of the status dot."
      },
      "title": {
        "type": "string",
        "description": "Text to show when hovering over the badge."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
