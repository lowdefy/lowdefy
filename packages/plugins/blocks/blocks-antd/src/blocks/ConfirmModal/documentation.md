<TITLE>
ConfirmModal
</TITLE>

<DESCRIPTION>

A popup container, presenting the user with a modal confirmation dialog.
The ConfirmModal has a single area, `content`.

> To open the confirm modal, invoke the open method.

</DESCRIPTION>

<SCHEMA>

```json
{
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "title": {
        "type": "string",
        "description": "Modal title - supports html."
      },
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
        "description": "Centered Modal."
      },
      "closable": {
        "type": "boolean",
        "default": false,
        "description": "Whether a close (x) button is visible on top right of the confirm dialog or not."
      },
      "content": {
        "type": "string",
        "description": "Modal content. Overridden by the \"content\" content area - supports html."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize modal icon.",
        "docs": {
          "displayType": "icon"
        }
      },
      "mask": {
        "type": "boolean",
        "default": true,
        "description": "Whether show mask or not."
      },
      "maskClosable": {
        "type": "boolean",
        "default": false,
        "description": "Whether to close the modal dialog when the mask (area outside the modal) is clicked."
      },
      "modalStyle": {
        "type": "object",
        "description": "Css style to applied to modal.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "okText": {
        "type": "string",
        "default": "Ok",
        "description": "Text of the Ok button."
      },
      "cancelText": {
        "type": "string",
        "default": "Cancel",
        "description": "Text of the Cancel button."
      },
      "okButton": {
        "type": "object",
        "description": "Ok button properties.",
        "docs": {
          "displayType": "button"
        }
      },
      "cancelButton": {
        "type": "object",
        "description": "Cancel button properties.",
        "docs": {
          "displayType": "button"
        }
      },
      "width": {
        "type": ["number", "string"],
        "default": 416,
        "description": "Width of the modal dialog.",
        "docs": {
          "displayType": "string"
        }
      },
      "zIndex": {
        "type": "number",
        "default": 1000,
        "description": "The z-index of the Modal."
      },
      "status": {
        "type": "string",
        "enum": ["success", "error", "info", "warning", "confirm"],
        "default": "confirm",
        "description": "Modal status type."
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
        "description": "Trigger actions when confirm modal is opened."
      },
      "onCancel": {
        "type": "array",
        "description": "Trigger actions when Cancel button is clicked."
      },
      "onClose": {
        "type": "array",
        "description": "Triggered after onOk or onCancel actions are completed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
