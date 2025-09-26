<TITLE>
TextInput
</TITLE>

<DESCRIPTION>

The `TextInput` block is a single line text input.

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
      "type": {
        "type": "string",
        "enum": ["text", "number", "password", "tel", "email", "url"],
        "default": "text",
        "description": "The type of input, (see <a href='https://developer.mozilla.org/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types'>MDN</a>)."
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
      "size": {
        "type": "string",
        "enum": ["small", "middle", "large"],
        "default": "middle",
        "description": "Size of the block."
      },
      "showCount": {
        "type": "boolean",
        "default": false,
        "description": "Show text character count"
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

### Required text input

```yaml
id: required_example
type: TextInput
required: true
properties:
  title: Required text input
```

### Placeholder

```yaml
id: placeholder_example
type: TextInput
properties:
  placeholder: Placeholder
```

### Prefix and suffix text

```yaml
id: prefix_suffix_example
type: TextInput
properties:
  label:
    extra: Prefix and suffix text
  placeholder: chased
  prefix: The cat
  suffix: the rat
```

### User name

```yaml
id: username
type: TextInput
properties:
  label:
    span: 6
  placeholder: Your name
  suffixIcon: AiOutlineUser
  title: First Name
```

### Field Type

```yaml
id: field_type_example
type: TextInput
properties:
  label:
    span: 6
  type: password
```

</EXAMPLES>
