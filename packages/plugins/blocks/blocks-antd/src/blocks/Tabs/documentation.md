<TITLE>
Tabs
</TITLE>

<DESCRIPTION>

Tabs to easily switch between different views.
The key of each tabs is the area keys of the container and there is an `extra` content area.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "animated": {
        "type": "boolean",
        "default": true,
        "description": "Whether to change tabs with animation. Only works while tabPosition is top or bottom."
      },
      "defaultActiveKey": {
        "type": "string",
        "description": "Initial active TabPane's key, if activeKey is not set."
      },
      "size": {
        "type": "string",
        "default": "default",
        "enum": ["default", "small", "large"],
        "description": "Size of the tabs."
      },
      "tabPosition": {
        "type": "string",
        "default": "top",
        "enum": ["top", "right", "bottom", "left"],
        "description": "Position of the tabs."
      },
      "tabType": {
        "type": "string",
        "default": "line",
        "enum": ["line", "card"],
        "description": "Type of tabs."
      },
      "tabs": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["key"],
          "properties": {
            "title": {
              "type": "string",
              "description": "Title of the tab - supports html."
            },
            "key": {
              "type": "string",
              "description": "Area key of the tab."
            },
            "disabled": {
              "type": "boolean",
              "default": false,
              "description": "Disable the tab if true."
            },
            "icon": {
              "type": ["string", "object"],
              "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to show in tab title.",
              "docs": {
                "displayType": "icon"
              }
            }
          }
        }
      },
      "tabBarStyle": {
        "type": "object",
        "description": "Css style to apply to the tab bar.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "extraAreaKey": {
        "type": "string",
        "description": "Area key for the extra area blocks."
      }
    }
  },
  "events": {
    "type": "object",
    "properties": {
      "onChange": {
        "type": "array",
        "description": "Trigger action on tab change."
      },
      "onTabScroll": {
        "type": "array",
        "description": "Trigger action on tab scroll."
      },
      "onTabClick": {
        "type": "array",
        "description": "Trigger action on tab click."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
