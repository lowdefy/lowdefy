<TITLE>
PasswordInput
</TITLE>

<DESCRIPTION>

The `PasswordInput` block is a single line password input.

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
        "description": "Whether or not the input has a border style."
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "placeholder": {
        "type": "string",
        "description": "Placeholder text inside the block before user types input."
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
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
      },
      "title": {
        "type": "string",
        "description": "Title to describe the input component, if no title is specified the block id is displayed - supports html."
      },
      "visibilityToggle": {
        "type": "boolean",
        "default": true,
        "description": "Show password visibility toggle button."
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

### Required password input

```yaml
id: required_example
type: PasswordInput
required: true
properties:
  title: Required password input
```

### Placeholder

```yaml
id: placeholder_example
type: PasswordInput
properties:
  placeholder: Placeholder
```

### Password

```yaml
id: password
type: PasswordInput
properties:
  label:
    span: 6
  placeholder: Your password
  title: Password
```

</EXAMPLES>
