<TITLE>
Alert
</TITLE>

<DESCRIPTION>

Alert is used to render user feedback messages in a Alert styled frame.

</DESCRIPTION>

<SCHEMA>

```json
{
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "banner": {
        "type": "boolean",
        "default": false,
        "description": "Style as banner at top of application window."
      },
      "closable": {
        "type": "boolean",
        "default": false,
        "description": "Allow alert to be closed."
      },
      "closeText": {
        "type": "string",
        "description": "Close text to show."
      },
      "description": {
        "type": "string",
        "description": "Content description of alert - supports html."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an Ant Design Icon or properties of an Icon block to customize alert icon.",
        "docs": {
          "displayType": "icon"
        }
      },
      "message": {
        "type": "string",
        "description": "Content message of alert - supports html."
      },
      "showIcon": {
        "type": "boolean",
        "default": true,
        "description": "Show type default icon."
      },
      "type": {
        "type": "string",
        "enum": ["success", "info", "warning", "error"],
        "default": "info",
        "description": "Alert style type."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClose": {
        "type": "array",
        "description": "Called when Alert close button is clicked."
      },
      "afterClose": {
        "type": "array",
        "description": "Called after Alert has been closed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
