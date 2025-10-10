<TITLE>
Popover
</TITLE>

<DESCRIPTION>

A popover container. Can be used to display extra information or options inside the popover.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "title": {
        "type": "string",
        "description": "Title of the card."
      },
      "color": {
        "type": "string",
        "description": "Popover background color.",
        "docs": {
          "displayType": "color"
        }
      },
      "defaultOpen": {
        "type": "boolean",
        "description": "Whether the popover is open by default.",
        "default": false
      },
      "autoAdjustOverflow": {
        "type": "boolean",
        "description": "Whether to adjust popup placement automatically when popup is off screen",
        "default": true
      },
      "placement": {
        "type": "string",
        "description": "Placement of the popover.",
        "enum": [
          "top",
          "topLeft",
          "topRight",
          "left",
          "leftTop",
          "leftBottom",
          "right",
          "rightTop",
          "rightBottom",
          "bottom",
          "bottomLeft",
          "bottomRight"
        ],
        "default": "bottom"
      },
      "trigger": {
        "type": "string",
        "description": "Trigger mode which executes the popover.",
        "enum": ["hover", "click", "focus"],
        "default": "hover"
      },
      "zIndex": {
        "type": "number",
        "description": "Z-index of the popover."
      },
      "overlayInnerStyle": {
        "type": "object",
        "description": "Style of overlay inner div.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "mouseEnterDelay": {
        "type": "number",
        "description": "Delay in milliseconds, before tooltip is shown on mouse enter.",
        "default": 0.1
      },
      "mouseLeaveDelay": {
        "type": "number",
        "description": "Delay in milliseconds, before tooltip is hidden on mouse leave.",
        "default": 0.1
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onOpenChange": {
        "type": "array",
        "description": "Trigger actions when visibility of the tooltip card is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Popover menu

```yaml
areas:
  popover:
    blocks:
      - id: profile
        properties:
          title: Profile
        type: Button
      - id: admin
        properties:
          title: Admin
        type: Button
      - id: logout
        properties:
          title: Logout
        type: Button
blocks:
  - id: settings
    properties:
      block: true
      icon: AiOutlineSetting
      title: Settings
    type: Button
id: button_ex
properties:
  title: Explains what happens.
type: Popover
```

</EXAMPLES>
