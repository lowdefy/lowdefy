<TITLE>
Icon
</TITLE>

<DESCRIPTION>

A Icon component. Render Ant Design and other icons

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
        "description": "Primary icon color.",
        "docs": {
          "displayType": "color"
        }
      },
      "name": {
        "type": "string",
        "default": "AiOutlineCloseCircle",
        "description": "Name of icon to be displayed."
      },
      "rotate": {
        "type": "number",
        "description": "Number of degrees to rotate the icon."
      },
      "size": {
        "type": ["string", "number"],
        "description": "Size of the icon.",
        "docs": {
          "displayType": "number"
        }
      },
      "spin": {
        "type": "boolean",
        "default": false,
        "description": "Continuously spin icon with animation."
      },
      "title": {
        "type": "string",
        "description": "Icon hover title for accessibility."
      },
      "style": {
        "type": "object",
        "description": "CSS style object.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "disableLoadingIcon": {
        "type": "boolean",
        "default": false,
        "description": "While loading after the icon has been clicked, don't render the loading icon."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Trigger actions when icon is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
