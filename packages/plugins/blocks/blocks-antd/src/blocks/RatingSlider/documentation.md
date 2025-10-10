<TITLE>
RatingSlider
</TITLE>

<DESCRIPTION>

The `RatingSlider` block allows a user to choose a numerical value on a slider input. It is typically used for scores or ratings. It has the option to have a "Not Applicable" checkbox, which leaves the value as null.

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
      "color": {
        "type": "string",
        "description": "Rating slider color.",
        "docs": {
          "displayType": "color"
        }
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "disableIcons": {
        "type": "boolean",
        "default": false,
        "description": "Hides minimum and maximum icons."
      },
      "disableNotApplicable": {
        "type": "boolean",
        "default": false,
        "description": "Disables the N/A option left of slider."
      },
      "minIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineFrown",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize the icon to the left of the minimum side of the slider.",
        "docs": {
          "displayType": "icon"
        }
      },
      "maxIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineSmile",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize the icon to the right of the maximum side of the slider.",
        "docs": {
          "displayType": "icon"
        }
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
        "default": 0,
        "description": "The minimum value of the slider."
      },
      "max": {
        "type": "number",
        "default": 10,
        "description": "The maximum value of the slider."
      },
      "notApplicableLabel": {
        "type": "string",
        "default": "N/A",
        "description": "Label shown at the null value of the slider."
      },
      "showDots": {
        "type": "boolean",
        "default": true,
        "description": "Shows dots at values between step values when true."
      },
      "showMarks": {
        "type": "boolean",
        "default": true,
        "description": "Shows values at specified min, max and step values."
      },
      "step": {
        "type": "number",
        "default": 1,
        "exclusiveMinimum": 0,
        "description": " The size of the step between values, has to be values greater than 0."
      },
      "tooltipVisible": {
        "type": "string",
        "enum": ["never", "onClick", "always"],
        "default": "onClick",
        "description": "When tooltip should be visible."
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
        "description": "Trigger action when rating is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
