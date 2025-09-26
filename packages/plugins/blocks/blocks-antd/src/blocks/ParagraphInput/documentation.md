<TITLE>
ParagraphInput
</TITLE>

<DESCRIPTION>

The `ParagraphInput` block can display a paragraph, yet allow the user to click a edit icon and change the paragraph content. This is useful when the UI renders an existing document with a paragraph, which a user must be able to edit.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "code": {
        "type": "boolean",
        "default": false,
        "description": "Apply code style."
      },
      "copyable": {
        "default": false,
        "oneOf": [
          {
            "type": "boolean",
            "description": "Provide copy text button."
          },
          {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "text": {
                "type": "string",
                "description": "Paragraph text to copy when clicked."
              },
              "icon": {
                "type": ["string", "object", "array"],
                "description": "Copy icon, can be an array or two icons for before and after clicked.",
                "docs": {
                  "displayType": "icon"
                }
              },
              "tooltips": {
                "type": ["string", "array"],
                "description": "Tooltip text, can be an array or two strings for before and after clicked.",
                "docs": {
                  "displayType": "string"
                }
              }
            }
          }
        ]
      },
      "delete": {
        "type": "boolean",
        "default": false,
        "description": "Apply deleted (strikethrough) style."
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Apply disabled style."
      },
      "editable": {
        "default": true,
        "oneOf": [
          {
            "type": "boolean",
            "description": "Allow paragraph editing when true, editable settings can be provided with editable object."
          },
          {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "icon": {
                "type": ["string", "object"],
                "description": "Edit icon.",
                "docs": {
                  "displayType": "icon"
                }
              },
              "tooltip": {
                "type": "string",
                "description": "Edit tooltip text."
              },
              "editing": {
                "type": "boolean",
                "description": "Control editing state."
              },
              "maxLength": {
                "type": "number",
                "description": "Max length of text area input."
              }
            }
          }
        ]
      },
      "ellipsis": {
        "default": false,
        "oneOf": [
          {
            "type": "boolean",
            "description": "Display ellipsis when text overflows a single line."
          },
          {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "rows": {
                "type": "number",
                "description": "Max rows of content."
              },
              "expandable": {
                "type": "boolean",
                "description": "Expand hidden content when clicked."
              },
              "suffix": {
                "type": "string",
                "description": "Suffix of ellipses content."
              }
            }
          }
        ]
      },
      "italic": {
        "type": "boolean",
        "default": false,
        "description": "Apply italic style."
      },
      "mark": {
        "type": "boolean",
        "default": false,
        "description": "Apply marked (highlighted) style."
      },
      "strong": {
        "type": "boolean",
        "default": false,
        "description": "Apply strong (bold) style."
      },
      "type": {
        "type": "string",
        "default": "default",
        "enum": ["success", "default", "secondary", "warning", "danger"],
        "description": "Additional types. Don't specify for default."
      },
      "underline": {
        "type": "boolean",
        "default": false,
        "description": "Apply underline style."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onExpand": {
        "type": "array",
        "description": "Trigger action when ellipse expand is clicked."
      },
      "onCopy": {
        "type": "array",
        "description": "Trigger action when copy text is clicked."
      },
      "onChange": {
        "type": "array",
        "description": "Trigger action when paragraph is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
