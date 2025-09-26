<TITLE>
TextArea
</TITLE>

<DESCRIPTION>

The `TextArea` block is a text input that has multiple rows of input. It can be set to a fixed number of rows, or it can expand automatically as the user inputs more text.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "allowClear": {
        "type": "boolean",
        "default": false,
        "description": "Allow the user to clear their input."
      },
      "autoFocus": {
        "type": "boolean",
        "default": false,
        "description": "Autofocus to the block on page load."
      },
      "autoSize": {
        "oneOf": [
          {
            "type": "boolean",
            "default": false,
            "description": "Automatically extend the block number of rows."
          },
          {
            "type": "object",
            "description": "Automatically extend the block number of rows, with a set minimum and maximum row amount.",
            "properties": {
              "minRows": {
                "type": "integer",
                "description": "Minimum number of rows the block can be."
              },
              "maxRows": {
                "type": "integer",
                "description": "Maximum number of rows the block can be."
              }
            }
          }
        ],
        "description": "autoSize can either be a boolean value, or an object with minimum and maximum rows.  Defining autoSize disables any prefix or suffix defined."
      },
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not the textarea has a border style."
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
      "maxLength": {
        "type": "integer",
        "description": "The max number of input characters."
      },
      "placeholder": {
        "type": "string",
        "description": "Placeholder text inside the block before user types input."
      },
      "rows": {
        "type": "integer",
        "minimum": 1,
        "description": "Number of rows in the block, should be greater or equal to 1. Defining rows disables any prefix."
      },
      "size": {
        "type": "string",
        "enum": ["small", "middle", "large"],
        "default": "middle",
        "description": "Size of the block."
      },
      "showCount": {
        "type": ["boolean", "object"],
        "default": false,
        "description": "Show input character count.",
        "docs": {
          "displayType": "boolean"
        }
      },
      "title": {
        "type": "string",
        "description": "Title to describe the input component, if no title is specified the block id is displayed - supports html."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onBlur": {
        "type": "array",
        "description": "Trigger action event occurs when text input loses focus."
      },
      "onChange": {
        "type": "array",
        "description": "Trigger action when text input is changed."
      },
      "onFocus": {
        "type": "array",
        "description": "Trigger action when text input gets focus."
      },
      "onPressEnter": {
        "type": "array",
        "description": "Trigger action when enter is pressed while text input is focused."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
