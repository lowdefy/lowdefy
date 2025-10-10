<TITLE>
CheckboxSwitch
</TITLE>

<DESCRIPTION>

The `CheckboxSwitch` block allows a user to select a boolean value between (true/false).

> A similar switch block is `Switch`. Alternatively the `CheckboxSelector` can be used to list multiple options.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "color": {
        "type": "string",
        "description": "Selected checkbox color.",
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
      "description": {
        "type": "string",
        "description": "Text to display next to the checkbox - supports html."
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

### Checkbox only

```yaml
id: checkbox_example
type: CheckboxSwitch
properties:
  label:
    disabled: true
```

### Description only

```yaml
id: description_example
type: CheckboxSwitch
properties:
  description: Option
```

### Description and label

```yaml
id: description_label_example
type: CheckboxSwitch
properties:
  description: Option
  label:
    title: Label
```

### Agree to terms and conditions

```yaml
id: terms_example
type: CheckboxSwitch
properties:
  description: I agree to the terms and conditions and privacy policy as found on the website.... Thoroughly I agree to the terms and conditions and privacy policy as found on the website....
  label:
    disabled: true
```

</EXAMPLES>
