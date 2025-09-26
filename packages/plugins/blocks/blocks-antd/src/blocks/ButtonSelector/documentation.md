<TITLE>
ButtonSelector
</TITLE>

<DESCRIPTION>

The `ButtonSelector` block allows a user to select a single value from a set of options. The user cannot deselect an option once they have selected an input.

The options for the selector can be provides as either an array of primitive values (strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

> Other selector blocks are `CheckboxSelector`, `MultipleSelector`, `RadioSelector` and `Selector`.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "buttonStyle": {
        "type": "string",
        "enum": ["solid", "outline"],
        "default": "solid",
        "description": "Style of the selected option button."
      },
      "color": {
        "type": "string",
        "description": "Selected button color.",
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
      "options": {
        "default": [],
        "oneOf": [
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs - supports html.",
            "items": {
              "type": "string"
            }
          },
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs.",
            "items": {
              "type": "number"
            }
          },
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs.",
            "items": {
              "type": "boolean"
            }
          },
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs.",
            "items": {
              "type": "object",
              "required": ["value"],
              "properties": {
                "label": {
                  "type": "string",
                  "description": "Value label shown to user - supports html."
                },
                "value": {
                  "description": "Value selected. Can be of any type.",
                  "oneOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "boolean"
                    },
                    {
                      "type": "object"
                    },
                    {
                      "type": "array"
                    }
                  ],
                  "docs": {
                    "displayType": "yaml"
                  }
                },
                "disabled": {
                  "type": "boolean",
                  "default": false,
                  "description": "Disable the option if true."
                },
                "style": {
                  "type": "object",
                  "description": "Css style to applied to option.",
                  "docs": {
                    "displayType": "yaml"
                  }
                }
              }
            }
          }
        ]
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
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
      "onChange": {
        "type": "array",
        "description": "Trigger actions when selection is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
