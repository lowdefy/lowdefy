<TITLE>
DateRangeSelector
</TITLE>

<DESCRIPTION>

The `DateRangeSelector` block allows the user to choose a start date and an end date for a date range. The selected range is saved as an array with two date elements, the start and end dates.

> Other date type blocks are `DateSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector`.

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
        "description": "Allow the user to clear their input."
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
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "disabledDates": {
        "type": "object",
        "description": "Disable specific dates so that they can not be chosen.",
        "properties": {
          "min": {
            "type": ["string", "object"],
            "description": "Disable all dates less than the minimum date. Can be a date string or a _date object.",
            "docs": {
              "displayType": "date"
            }
          },
          "max": {
            "type": ["string", "object"],
            "description": "Disable all dates greater than the maximum date. Can be a date string or a _date object.",
            "docs": {
              "displayType": "date"
            }
          },
          "dates": {
            "type": "array",
            "description": "Array of specific dates to be disabled. Can be date strings or a _date objects.",
            "items": {
              "type": ["string", "object"],
              "description": "Specific dates to be disabled.",
              "docs": {
                "displayType": "date"
              }
            }
          },
          "ranges": {
            "type": "array",
            "description": "Array of array pairs of start and end dates be disabled. Can be date strings or a _date objects.",
            "items": {
              "type": "array",
              "description": "Specific date ranges to be disabled.",
              "items": {
                "type": ["string", "object"]
              },
              "docs": {
                "displayType": "dateRange"
              }
            }
          }
        }
      },
      "format": {
        "type": "string",
        "default": "YYYY-MM-DD",
        "description": "Format in which to parse the date value, eg. \"DD MMMM YYYY\" will parse a date value of 1999-12-31 as \"31 December 1999\". The format has to conform to moment.js formats."
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
      "placeholder": {
        "type": "array",
        "default": ["Start Date", "End Date"],
        "description": "Placeholder text inside the block before user types input.",
        "docs": {
          "displayType": "manual",
          "block": {
            "id": "block_properties_placeholder",
            "layout": { "_global": "settings_input_layout" },
            "type": "Label",
            "properties": {
              "title": "placeholder",
              "span": 8,
              "align": "right",
              "extra": "Placeholder text inside the block before user types input."
            },
            "blocks": [
              {
                "id": "block.properties.placeholder.0",
                "layout": { "span": 12 },
                "type": "TextInput",
                "properties": {
                  "size": "small",
                  "label": {
                    "disabled": true
                  }
                }
              },
              {
                "id": "block.properties.placeholder.1",
                "layout": { "span": 12 },
                "type": "TextInput",
                "properties": {
                  "size": "small",
                  "label": {
                    "disabled": true
                  }
                }
              }
            ]
          }
        }
      },
      "separator": {
        "type": "string",
        "default": "~",
        "description": "Separator symbol shown between start and end date inputs."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
      },
      "suffixIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineCalendar",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on right-hand side of the date picker.",
        "docs": {
          "displayType": "icon"
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
