<TITLE>
Drawer
</TITLE>

<DESCRIPTION>

A panel which slides in from the edge of the screen.
The Drawer has a single area, `content`.

> To open the drawer, invoke a drawer method.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "closable": {
        "type": "boolean",
        "default": true,
        "description": "Whether a close (x) button is visible on top right of the Drawer dialog or not."
      },
      "mask": {
        "type": "boolean",
        "default": true,
        "description": "Whether to show mask or not."
      },
      "maskClosable": {
        "type": "boolean",
        "default": true,
        "description": "Clicking on the mask (area outside the Drawer) to close the Drawer or not."
      },
      "title": {
        "type": "string",
        "description": "The title of the Drawer."
      },
      "width": {
        "type": ["string", "number"],
        "default": "256px",
        "description": "Width of the Drawer dialog.",
        "docs": {
          "displayType": "string"
        }
      },
      "height": {
        "type": ["string", "number"],
        "default": "256px",
        "description": "When placement is top or bottom, height of the Drawer dialog.",
        "docs": {
          "displayType": "string"
        }
      },
      "headerStyle": {
        "type": "object",
        "description": "Css style to applied to drawer header.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "bodyStyle": {
        "type": "object",
        "description": "Css style to applied to drawer body.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "contentWrapperStyle": {
        "type": "object",
        "description": "Css style to applied to content area.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "maskStyle": {
        "type": "object",
        "description": "Css style to applied to drawer mask.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "drawerStyle": {
        "type": "object",
        "description": "Css style to applied to drawer.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "zIndex": {
        "type": "integer",
        "default": 1000,
        "description": "The z-index of the Drawer."
      },
      "placement": {
        "type": "string",
        "enum": ["top", "right", "bottom", "left"],
        "default": "right",
        "description": "The placement of the Drawer."
      },
      "keyboard": {
        "type": "boolean",
        "default": true,
        "description": "Whether support press esc to close."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onToggle": {
        "type": "array",
        "description": "Trigger actions when drawer is toggled."
      },
      "onClose": {
        "type": "array",
        "description": "Trigger actions when drawer is closed."
      },
      "onOpen": {
        "type": "array",
        "description": "Trigger actions when drawer is opened."
      },
      "afterClose": {
        "type": "array",
        "description": "Trigger actions after drawer is closed."
      },
      "afterOpenChange": {
        "type": "array",
        "description": "Trigger actions after drawer is opened."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
