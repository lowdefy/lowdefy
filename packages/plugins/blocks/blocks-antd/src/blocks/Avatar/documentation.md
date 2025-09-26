<TITLE>
Avatar
</TITLE>

<DESCRIPTION>

Avatars can be used to represent people or objects. It supports images, Icons, or letters.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "alt": {
        "type": "string",
        "description": "This attribute defines the alternative text describing the image."
      },
      "color": {
        "type": "string",
        "description": "The background color of the avatar if not using a src url. Should be a hex color string. Color is a random color if not specified.",
        "docs": {
          "displayType": "color"
        }
      },
      "content": {
        "type": "string",
        "description": "Text to display inside avatar."
      },
      "gap": {
        "type": "number",
        "description": "Letter type unit distance between left and right sides."
      },
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in avatar.",
        "docs": {
          "displayType": "icon"
        }
      },
      "shape": {
        "type": "string",
        "enum": ["circle", "square"],
        "default": "circle",
        "description": "Shape of the avatar."
      },
      "size": {
        "type": ["string", "object"],
        "default": "default",
        "enum": ["default", "small", "large"],
        "description": "Size of the avatar; default, small, large or responsive.",
        "docs": {
          "displayType": "string"
        }
      },
      "src": {
        "type": "string",
        "description": "The address of the image for an image avatar."
      },
      "style": {
        "type": "object",
        "description": "Css style object to applied to avatar.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Triggered when avatar item is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
