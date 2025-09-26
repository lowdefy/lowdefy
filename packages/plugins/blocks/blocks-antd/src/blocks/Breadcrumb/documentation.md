<TITLE>
Breadcrumb
</TITLE>

<DESCRIPTION>

A breadcrumb displays the current location within a hierarchy. It allows going back to states higher up in the hierarchy with provided links.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "separator": {
        "type": "string",
        "default": "/",
        "description": "Use a custom separator string."
      },
      "style": {
        "type": "object",
        "description": "Css style object to applied to breadcrumb.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "list": {
        "oneOf": [
          {
            "type": "array",
            "description": "List of breadcrumb links.",
            "items": {
              "type": "string",
              "description": "Title of the breadcrumb link."
            }
          },
          {
            "type": "array",
            "description": "List of breadcrumb links.",
            "items": {
              "type": "object",
              "properties": {
                "label": {
                  "type": "string",
                  "description": "Label of the breadcrumb link."
                },
                "pageId": {
                  "type": "string",
                  "description": "Page id to link to when clicked."
                },
                "url": {
                  "type": "string",
                  "description": "External url link."
                },
                "style": {
                  "type": "object",
                  "description": "Css style to apply to link.",
                  "docs": {
                    "displayType": "yaml"
                  }
                },
                "icon": {
                  "type": ["string", "object"],
                  "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to use an icon in breadcrumb link.",
                  "docs": {
                    "displayType": "icon"
                  }
                }
              }
            }
          }
        ]
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Triggered when breadcrumb item is clicked. Provides clicked link and index as args."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
