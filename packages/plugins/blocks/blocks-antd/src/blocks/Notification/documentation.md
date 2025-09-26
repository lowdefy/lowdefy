<TITLE>
Notification
</TITLE>

<DESCRIPTION>

Display a popup notification on the page.

> To display a notification, invoke the open method.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "bottom": {
        "type": "number",
        "default": 24,
        "description": "Distance from the bottom of the viewport, when placement is bottomRight or bottomLeft (unit: pixels)."
      },
      "button": {
        "type": "object",
        "description": "Button object to customized the close button. Triggers onClose event when clicked.",
        "docs": {
          "displayType": "button"
        }
      },
      "description": {
        "type": "string",
        "description": "The content of notification box - supports html."
      },
      "duration": {
        "type": "number",
        "default": 4.5,
        "description": "Time in seconds before Notification is closed. When set to 0 or null, it will never be closed automatically."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize notification icon.",
        "docs": {
          "displayType": "icon"
        }
      },
      "closeIcon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize close icon.",
        "docs": {
          "displayType": "icon"
        }
      },
      "message": {
        "type": "string",
        "description": "The title of notification box - supports html."
      },
      "notificationStyle": {
        "type": "object",
        "description": "Css style to applied to notification.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "placement": {
        "type": "string",
        "enum": ["topLeft", "topRight", "bottomLeft", "bottomRight"],
        "default": "topRight",
        "description": "Position of Notification."
      },
      "top": {
        "type": "number",
        "default": 24,
        "description": "Distance from the top of the viewport, when placement is topRight or topLeft (unit: pixels)."
      },
      "status": {
        "type": "string",
        "enum": ["success", "error", "info", "warning"],
        "description": "Notification status type."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClose": {
        "type": "array",
        "description": "Trigger actions when notification is closed."
      },
      "onClick": {
        "type": "array",
        "description": "Trigger actions when notification is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Opening a Notification

```yaml
- id: open
  type: CallMethod
  params:
    blockId: block_id
    method: open
```

</EXAMPLES>
