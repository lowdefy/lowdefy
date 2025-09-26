<TITLE>
PhoneNumberInput
</TITLE>

<DESCRIPTION>

The `PhoneNumberInput` block is a region dial code selector with a single line text input.

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
      "allowedRegions": {
        "type": "array",
        "description": "List of allowed ISO 3166-1 alpha-2 region codes. If allowedRegions is [] or null, the default list of all regions is used.",
        "items": {
          "type": "string"
        }
      },
      "autoFocus": {
        "type": "boolean",
        "default": false,
        "description": "Autofocus to the block on page load."
      },
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not the text input has a border style."
      },
      "defaultRegion": {
        "type": "string",
        "description": "The dial code of the default region to be used."
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "maxLength": {
        "type": "integer",
        "description": "The max number of input characters."
      },
      "placeholder": {
        "type": "string",
        "description": "Placeholder text inside the block before user types input."
      },
      "prefix": {
        "type": "string",
        "description": "Prefix text for the block, priority over $prefix_con."
      },
      "prefixIcon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to prefix the text input.",
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
      "optionsStyle": {
        "type": "object",
        "description": "Css style to applied to option elements.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "replaceInput": {
        "type": "object",
        "description": "Regex used to sanitize input.",
        "properties": {
          "pattern": {
            "type": "string",
            "description": "The regular expression pattern to use to sanitize input."
          },
          "flags": {
            "type": "string",
            "description": "The regex flags to use. The default value is 'gm'."
          },
          "replacement": {
            "type": "string",
            "description": "The string used to replace the input that matches the pattern. The default value is ''."
          }
        },
        "docs": {
          "displayType": "yaml"
        }
      },
      "selectStyle": {
        "type": "object",
        "description": "Css style to applied to selector.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "showArrow": {
        "type": "boolean",
        "default": true,
        "description": "Show the suffix icon at the drop-down position of the selector."
      },
      "size": {
        "type": "string",
        "enum": ["small", "middle", "large"],
        "default": "middle",
        "description": "Size of the block."
      },
      "suffix": {
        "type": "string",
        "description": "Suffix text for the block, priority over suffixIcon."
      },
      "suffixIcon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to suffix the text input.",
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
      "onInputChange": {
        "type": "array",
        "description": "Trigger action when text input is changed."
      },
      "onCodeChange": {
        "type": "array",
        "description": "Trigger action when the selector is changed."
      },
      "onChange": {
        "type": "array",
        "description": "Trigger action when the number is changed."
      },
      "onBlur": {
        "type": "array",
        "description": "Trigger action event occurs when input loses focus."
      },
      "onFocus": {
        "type": "array",
        "description": "Trigger action when input gets focus."
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

### Simple phone number input

```yaml
id: default
type: PhoneNumberInput
```

### Phone number input with specified regions

```yaml
id: allowed_regions
type: PhoneNumberInput
properties:
  allowedRegions:
    - ZA
    - UA
```

### Phone number input with default region and flags disabled

```yaml
id: default_region
type: PhoneNumberInput
properties:
  defaultRegion: US
  showFlags: false
```

</EXAMPLES>
