<TITLE>
Tooltip
</TITLE>

<DESCRIPTION>

A simple text popup tip. Can be used to display extra information about its children blocks.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "arrowPointAtCenter": {
        "type": "boolean",
        "default": false,
        "description": "Whether the arrow is pointed at the center of target."
      },
      "autoAdjustOverflow": {
        "type": "boolean",
        "default": true,
        "description": "Whether to adjust popup placement automatically when popup is off screen."
      },
      "overlayStyle": {
        "type": "object",
        "description": "Style of the tooltip card.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "color": {
        "type": "string",
        "description": "The background color.",
        "docs": {
          "displayType": "color"
        }
      },
      "defaultVisible": {
        "type": "boolean",
        "default": false,
        "description": "Whether the floating tooltip card is visible by default."
      },
      "mouseEnterDelay": {
        "type": "number",
        "default": 0.1,
        "description": "Delay in seconds, before tooltip is shown on mouse enter."
      },
      "mouseLeaveDelay": {
        "type": "number",
        "default": 0.1,
        "description": "Delay in seconds, before tooltip is shown on mouse enter."
      },
      "placement": {
        "type": "string",
        "enum": [
          "top",
          "left",
          "right",
          "bottom",
          "topLeft",
          "topRight",
          "bottomLeft",
          "bottomRight",
          "leftTop",
          "leftBottom",
          "rightTop",
          "rightBottom"
        ],
        "default": "top",
        "description": "The position of the tooltip relative to the target."
      },
      "trigger": {
        "type": "string",
        "enum": ["hover", "focus", "click"],
        "default": "hover",
        "description": "Tooltip trigger mode."
      },
      "title": {
        "type": "string",
        "description": "Title to show in the title area - supports html. Overwritten by blocks in the title content area."
      },
      "zIndex": {
        "type": "integer",
        "description": "The z-index of the Tooltip."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onVisibleChange": {
        "type": "array",
        "description": "Trigger action when visibility of the tooltip card is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Button tooltip

```yaml
id: button_ex
type: Tooltip
properties:
  title: Explains what happens when this button is clicked.
blocks:
  - id: btn
    type: Button
    properties:
      title: Button
```

</EXAMPLES>
