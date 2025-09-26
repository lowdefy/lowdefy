<TITLE>
AutoComplete
</TITLE>

<DESCRIPTION>

The AutoComplete block is a text input that has a list of suggestions for the user. These suggestions are filtered as the user fills in the input. The user is also allowed to fill in an input not part of that list.

>If you need the user to select only from a list of options (and be able to select the top match for the given input by simply hitting Enter), use a block like the `Selector` block instead.

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
        "default": true,
        "description": "Allow the user to clear the selected value, sets the value to null."
      },
      "autoFocus": {
        "type": "boolean",
        "default": false,
        "description": "Autofocus to the block on page load."
      },
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not the input has a border style."
      },
      "backfill": {
        "type": "boolean",
        "default": false,
        "description": "Backfill selected item the input when using keyboard"
      },
      "defaultOpen": {
        "type": "boolean",
        "default": false,
        "description": "Initial open state of dropdown."
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
            "description": "Extra text to display beneath the content."
          },
          "title": {
            "type": "string",
            "description": "Label title."
          },
          "span": {
            "type": "number",
            "description": "Label inline span."
          },
          "disabled": {
            "type": "boolean",
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
      "options": {
        "default": [],
        "type": "array",
        "description": "Options can either be an array of string values.",
        "items": {
          "type": "string"
        }
      },
      "optionsStyle": {
        "type": "object",
        "description": "Css style to applied to option elements.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "placeholder": {
        "type": "string",
        "default": "Type or select item",
        "description": "Placeholder text inside the block before user selects input."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
      },
      "title": {
        "type": "string",
        "description": "Title to describe the input component, if no title is specified the block id is displayed."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onBlur": {
        "type": "array",
        "description": "Trigger action event occurs when selector loses focus."
      },
      "onChange": {
        "type": "array",
        "description": "Trigger actions when selection is changed."
      },
      "onFocus": {
        "type": "array",
        "description": "Trigger action when an selector gets focus."
      },
      "onClear": {
        "type": "array",
        "description": "Trigger action when selector gets cleared."
      },
      "onSearch": {
        "type": "array",
        "description": "Called when searching items."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
