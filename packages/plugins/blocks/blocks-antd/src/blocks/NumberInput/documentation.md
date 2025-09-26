<TITLE>
NumberInput
</TITLE>

<DESCRIPTION>

The `NumberInput` allows a user to input a number.

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
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not the number input has a border style."
      },
      "controls": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not to show the +- controls."
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "formatter": {
        "type": "object",
        "description": "A function specifying the format of the value presented.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "keyboard": {
        "type": "boolean",
        "default": true,
        "description": "If enabled, control input with keyboard up and down."
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
      "min": {
        "type": "number",
        "description": "Minimum value allowed by the block."
      },
      "max": {
        "type": "number",
        "description": "Maximum value allowed by the block."
      },
      "parser": {
        "type": "object",
        "description": "A function specifying the value extracted from the formatter.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "placeholder": {
        "type": "string",
        "description": "Placeholder text inside the block to show message before user types input."
      },
      "decimalSeparator": {
        "type": "string",
        "default": ".",
        "description": "Separator between number and decimal places."
      },
      "precision": {
        "type": "integer",
        "description": "Precision (number of decimal places) allowed by the block."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
      },
      "step": {
        "type": "number",
        "default": 1,
        "description": "The number to which the current value is increased or decreased. It can be an integer or decimal."
      },
      "title": {
        "type": "string",
        "description": "Number input label title - supports html."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onBlur": {
        "type": "array",
        "description": "Trigger action event occurs when number input loses focus."
      },
      "onChange": {
        "type": "array",
        "description": "Trigger action when number input is changed."
      },
      "onFocus": {
        "type": "array",
        "description": "Trigger action when number input gets focus."
      },
      "onPressEnter": {
        "type": "array",
        "description": "Trigger actions when input is focused and enter is pressed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
