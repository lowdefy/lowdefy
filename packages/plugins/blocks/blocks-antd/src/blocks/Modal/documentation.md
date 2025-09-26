<TITLE>
Modal
</TITLE>

<DESCRIPTION>

A popup container, presenting the user with a modal dialog.
The Modal has a `content` and a `footer` content area. The default `footer` area is the `Ok` and `Cancel` buttons; defining a `footer` area overwrites these buttons.

> To open the modal, invoke a modal method.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "bodyStyle": {
        "type": "object",
        "description": "Css style to applied to modal body.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "centered": {
        "type": "boolean",
        "default": false,
        "description": "Center the modal vertically."
      },
      "closable": {
        "type": "boolean",
        "default": true,
        "description": "Whether a close (x) button is visible on top right of the modal dialog or not."
      },
      "title": {
        "type": "string",
        "description": "The modal dialog's title - supports html."
      },
      "footer": {
        "type": "boolean",
        "default": true,
        "description": "Show footer area."
      },
      "mask": {
        "type": "boolean",
        "default": true,
        "description": "Whether show mask or not."
      },
      "maskStyle": {
        "type": "object",
        "description": "Css style to applied to modal mask.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "maskClosable": {
        "type": "boolean",
        "default": true,
        "description": "Whether to close the modal dialog when the mask (area outside the modal) is clicked."
      },
      "okText": {
        "type": "string",
        "default": "Ok",
        "description": "Text of the Ok button."
      },
      "okButtonProps": {
        "type": "object",
        "description": "Set additional properties for the ok button.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "style": {
        "type": "object",
        "description": "Css style to applied to modal.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "cancelText": {
        "type": "string",
        "default": "Cancel",
        "description": "Text of the Cancel button."
      },
      "cancelButtonProps": {
        "type": "object",
        "description": "Set additional properties for the cancel button.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "width": {
        "type": ["string", "number"],
        "default": "520px",
        "description": "Width of the modal dialog.",
        "docs": {
          "displayType": "string"
        }
      },
      "wrapperStyle": {
        "type": "object",
        "description": "Css style to applied to modal wrapper.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "zIndex": {
        "type": "integer",
        "default": 1000,
        "description": "The z-index of the modal. Useful when displaying two modals simultaneously."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onOk": {
        "type": "array",
        "description": "Trigger actions when Ok button is clicked."
      },
      "onOpen": {
        "type": "array",
        "description": "Trigger actions when modal is opened."
      },
      "onCancel": {
        "type": "array",
        "description": "Trigger actions when Cancel button is clicked."
      },
      "onClose": {
        "type": "array",
        "description": "Trigger actions after onOk or onCancel is completed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
