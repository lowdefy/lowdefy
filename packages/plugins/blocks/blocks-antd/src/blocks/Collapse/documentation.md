<TITLE>
Collapse
</TITLE>

<DESCRIPTION>

A container with collapsible panels. The area keys are user defined, and should be listed under the `panels` property. Each panel also has a 'extra' content area, the key of which can be defined in the `panels.$.extraKey` property.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "accordion": {
        "type": "boolean",
        "default": false,
        "description": "If true, only one panel is open at a time."
      },
      "activeKey": {
        "type": "string",
        "description": "Current panel's key."
      },
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Toggles rendering of the border around the collapse block."
      },
      "defaultActiveKey": {
        "type": "string",
        "description": "Initial active panel's key, if activeKey is not set."
      },
      "destroyInactivePanel": {
        "type": "boolean",
        "default": false,
        "description": "Destroy inactive panel."
      },
      "expandIcon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block for expand icon on the right of selector.",
        "docs": {
          "displayType": "icon"
        }
      },
      "expandIconPosition": {
        "type": "string",
        "enum": ["left", "right"],
        "default": "left",
        "description": "Set position of expand icon."
      },
      "forceRender": {
        "type": "boolean",
        "default": "false",
        "description": "Force render for all panels."
      },
      "panels": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Title of the panel - supports html."
            },
            "key": {
              "type": "string",
              "description": "Key of the panel."
            },
            "extraKey": {
              "type": "string",
              "description": "Key for the extra area of the panel."
            },
            "disabled": {
              "type": "boolean",
              "default": false,
              "description": "Disable the panel if true."
            }
          }
        }
      },
      "showArrow": {
        "type": "boolean",
        "default": true,
        "description": "Show expand icon."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onChange": {
        "type": "array",
        "description": "Trigger actions when collapse item is toggled."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
