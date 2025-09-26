<TITLE>
Switch
</TITLE>

<DESCRIPTION>

The `Switch` block is an on/off input. It has a boolean value (true/false).

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "autoFocus": {
        "type": "boolean",
        "default": false,
        "description": "Autofocus to the block on page load."
      },
      "checkedIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineCheck",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to shown when switch is checked (true).",
        "docs": {
          "displayType": "icon"
        }
      },
      "checkedText": {
        "type": "string",
        "description": "Text to shown when switch is checked (true)."
      },
      "color": {
        "type": "string",
        "description": "Switch checked color.",
        "docs": {
          "displayType": "color"
        }
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "inputStyle": {
        "type": "object",
        "description": "Css style to applied to input.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "label": {
        "type": "object",
        "description": "Label properties.",
        "additionalProperties": false,
        "properties": {
          "align": {
            "type": "string",
            "enum": ["left", "right"],
            "default": "left",
            "description": "Align label left or right when inline."
          },
          "colon": {
            "type": "boolean",
            "default": true,
            "description": "Append label with colon."
          },
          "extra": {
            "type": "string",
            "description": "Extra text to display beneath the content - supports html."
          },
          "title": {
            "type": "string",
            "description": "Label title - supports html."
          },
          "span": {
            "type": "number",
            "description": "Label inline span."
          },
          "disabled": {
            "type": "boolean",
            "default": false,
            "description": "Hide input label."
          },
          "hasFeedback": {
            "type": "boolean",
            "default": true,
            "description": "Display feedback extra from validation, this does not disable validation."
          },
          "inline": {
            "type": "boolean",
            "default": false,
            "description": "Render input and label inline."
          },
          "extraStyle": {
            "type": "object",
            "description": "Css style to applied to label extra.",
            "docs": {
              "displayType": "yaml"
            }
          },
          "feedbackStyle": {
            "type": "object",
            "description": "Css style to applied to label feedback.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      },
      "size": {
        "type": "string",
        "enum": ["small", "default"],
        "default": "default",
        "description": "Size of the block."
      },
      "title": {
        "type": "string",
        "description": "Title to describe the input component, if no title is specified the block id is displayed - supports html."
      },
      "uncheckedIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineClose",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to shown when switch is unchecked (false).",
        "docs": {
          "displayType": "icon"
        }
      },
      "uncheckedText": {
        "type": "string",
        "description": "Text to shown when switch is not checked (false)."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onChange": {
        "type": "array",
        "description": "Trigger action when switch is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
