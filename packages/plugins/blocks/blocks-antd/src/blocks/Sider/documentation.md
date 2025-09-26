<TITLE>
Sider
</TITLE>

<DESCRIPTION>

The `Sider` block provides a page container for a [sider](https://4x.ant.design/components/layout/) area with content.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "breakpoint": {
        "type": "string",
        "enum": ["xs", "sm", "md", "lg", "xl", "xxl"],
        "default": "sm",
        "description": "Breakpoint of the responsive layout"
      },
      "collapsedWidth": {
        "type": "integer",
        "description": "Width of the collapsed sidebar, by setting to 0 a special trigger will appear"
      },
      "collapsible": {
        "type": "boolean",
        "description": "Whether can be collapsed"
      },
      "initialCollapsed": {
        "type": "boolean",
        "default": true,
        "description": "Set the initial collapsed state"
      },
      "reverseArrow": {
        "type": "boolean",
        "default": false,
        "description": "Direction of arrow, for a sider that expands from the right"
      },
      "theme": {
        "type": "string",
        "enum": ["light", "dark"],
        "default": "dark",
        "description": "Color theme of the sidebar"
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to sider.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "width": {
        "type": ["string", "number"],
        "description": "width of the sidebar",
        "docs": {
          "displayType": "string"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClose": {
        "type": "array",
        "description": "Trigger actions when sider is closed."
      },
      "onOpen": {
        "type": "array",
        "description": "Trigger actions when sider is opened."
      },
      "onBreakpoint": {
        "type": "array",
        "description": "Trigger actions on breakpoint change."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
