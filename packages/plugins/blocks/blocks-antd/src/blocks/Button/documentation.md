<TITLE>
Button
</TITLE>

<DESCRIPTION>

Button block.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "block": {
        "type": "boolean",
        "description": "Fit the button's span to its parent container span.",
        "default": false
      },
      "color": {
        "type": "string",
        "description": "Button color.",
        "docs": {
          "displayType": "color"
        }
      },
      "danger": {
        "type": "boolean",
        "description": "Set button style to danger.",
        "default": false
      },
      "disabled": {
        "type": "boolean",
        "description": "Disable the button if true.",
        "default": false
      },
      "ghost": {
        "type": "boolean",
        "description": "Make the button's background transparent when true.",
        "default": false
      },
      "hideTitle": {
        "type": "boolean",
        "description": "Hide the button's title.",
        "default": false
      },
      "href": {
        "type": "string",
        "description": "The URL to redirect to when the button is clicked. Useful when used with a type link button."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use icon in button.",
        "docs": {
          "displayType": "icon"
        }
      },
      "shape": {
        "type": "string",
        "default": "square",
        "enum": ["circle", "round", "square"],
        "description": "Shape of the button."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the button."
      },
      "style": {
        "type": "object",
        "description": "Css style object to applied to button.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "title": {
        "type": "string",
        "description": "Title text on the button - supports html."
      },
      "type": {
        "type": "string",
        "default": "primary",
        "enum": ["primary", "default", "dashed", "danger", "link", "text"],
        "description": "The button type."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Trigger action when button is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Block and ghost button with icon

```yaml
id: ghost_example
type: Button
properties:
  block: true
  ghost: true
  icon: AiOutlineRocket
  title: Get started
```

### Round and type danger

```yaml
id: danger_example
type: Button
properties:
  icon: AiOutlineWarning
  shape: round
  title: Delete Forever
  type: danger
```

</EXAMPLES>
