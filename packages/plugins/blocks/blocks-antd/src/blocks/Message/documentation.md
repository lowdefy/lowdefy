<TITLE>
Message
</TITLE>

<DESCRIPTION>

Display a popup message on the page.

> To display a message, invoke the open method.

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
        "description": "The content of the message - supports html."
      },
      "duration": {
        "type": "number",
        "default": 4.5,
        "description": "Time(seconds) before auto-dismiss, don't dismiss if set to 0."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize message icon.",
        "docs": {
          "displayType": "icon"
        }
      },
      "status": {
        "type": "string",
        "enum": ["success", "error", "info", "warning", "loading"],
        "default": "info",
        "description": "Message status type."
      },
      "messageStyle": {
        "type": "object",
        "description": "Css style to applied to message.",
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
      "onClose": {
        "type": "array",
        "description": "Trigger actions when message is closed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Opening a Message

```yaml
- id: open
  type: CallMethod
  params:
    blockId: block_id
    method: open
```

</EXAMPLES>
