<TITLE>
PageSiderMenu
</TITLE>

<DESCRIPTION>

The Page Sider Menu block provides a structured layout for a page with a header, sider including menu, content and footer area.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "logo": {
        "type": "object",
        "description": "Header logo settings.",
        "additionalProperties": false,
        "properties": {
          "src": {
            "type": "string",
            "description": "Header logo source url."
          },
          "srcMobile": {
            "type": "string",
            "description": "Header logo img element for mobile."
          },
          "breakpoint": {
            "type": "number",
            "description": "Header logo breakpoint for switching between mobile and desktop logo."
          },
          "alt": {
            "type": "string",
            "default": "Lowdefy",
            "description": "Header logo alternative text."
          },
          "style": {
            "type": "object",
            "description": "Css style object to apply to logo.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      },
      "header": {
        "type": "object",
        "description": "Header properties.",
        "additionalProperties": false,
        "properties": {
          "theme": {
            "type": "string",
            "enum": ["light", "dark"],
            "description": "Header theme color."
          },
          "contentStyle": {
            "type": "object",
            "description": "Header content css style object.",
            "docs": {
              "displayType": "yaml"
            }
          },
          "style": {
            "type": "object",
            "description": "Header css style object.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      },
      "sider": {
        "type": "object",
        "description": "Sider properties.",
        "additionalProperties": false,
        "properties": {
          "breakpoint": {
            "type": "string",
            "enum": ["xs", "sm", "md", "lg", "xl"],
            "default": "sm",
            "description": "Breakpoint of the responsive layout."
          },
          "collapsedWidth": {
            "type": "integer",
            "description": "Width of the collapsed sidebar, by setting to 0 a special trigger will appear."
          },
          "collapsible": {
            "type": "boolean",
            "default": true,
            "description": "Whether can be collapsed."
          },
          "initialCollapsed": {
            "type": "boolean",
            "default": true,
            "description": "Set the initial collapsed state."
          },
          "reverseArrow": {
            "type": "boolean",
            "default": false,
            "description": "Direction of arrow, for a sider that expands from the right."
          },
          "theme": {
            "type": "string",
            "enum": ["light", "dark"],
            "default": "light",
            "description": "Color theme of the sidebar."
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
            "default": "string",
            "description": "width of the sidebar",
            "docs": {
              "displayType": "string"
            }
          },
          "hideToggleButton": {
            "type": "boolean",
            "description": "Hide toggle button in sider.",
            "default": false
          }
        }
      },
      "toggleSiderButton": {
        "type": "object",
        "description": "Toggle sider button properties.",
        "docs": {
          "displayType": "button"
        }
      },
      "footer": {
        "type": "object",
        "description": "Footer properties.",
        "additionalProperties": false,
        "properties": {
          "style": {
            "type": "object",
            "description": "Footer css style object.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      },
      "content": {
        "type": "object",
        "description": "Content properties.",
        "additionalProperties": false,
        "properties": {
          "style": {
            "type": "object",
            "description": "Content css style object.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      },
      "breadcrumb": {
        "type": "object",
        "description": "Breadcrumb properties.",
        "properties": {
          "separator": {
            "type": "string",
            "default": "/",
            "description": "Use a custom separator string."
          },
          "list": {
            "type": "array",
            "description": "List of breadcrumb links.",
            "items": {
              "type": "string",
              "description": "Title of the breadcrumb link."
            }
          }
        }
      },
      "menu": {
        "type": "object",
        "description": "Menu properties.",
        "properties": {
          "theme": {
            "type": "string",
            "enum": ["dark", "light"],
            "default": "light",
            "description": "Color theme of menu."
          },
          "links": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["id", "type"],
              "properties": {
                "id": {
                  "type": "string",
                  "description": "Menu item id."
                },
                "pageId": {
                  "type": "string",
                  "description": "Page to link to."
                },
                "properties": {
                  "type": "object",
                  "description": "properties from menu item.",
                  "properties": {
                    "title": {
                      "type": "string",
                      "description": "Menu item title."
                    },
                    "icon": {
                      "type": ["string", "object"],
                      "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon on menu item.",
                      "docs": {
                        "displayType": "icon"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "menuLg": {
        "type": "object",
        "description": "Menu large screen properties. Overwrites menu properties on desktop screen sizes.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "menuMd": {
        "type": "object",
        "description": "Mobile menu properies. Overwrites menu properties on mobile screen sizes.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to layout.",
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
      "onBreadcrumbClick": {
        "type": "array",
        "description": "Trigger action when a breadcrumb item is clicked."
      },
      "onChangeToggleSiderAffix": {
        "type": "array",
        "description": "Trigger action when sider collapse button affix triggers a onChange event."
      },
      "onClose": {
        "type": "array",
        "description": "Trigger action when menu is closed."
      },
      "onMenuItemSelect": {
        "type": "array",
        "description": "Trigger action when menu item is selected."
      },
      "onMenuItemClick": {
        "type": "array",
        "description": "Trigger action when menu item is clicked."
      },
      "onOpen": {
        "type": "array",
        "description": "Trigger action when menu is open."
      },
      "onToggleDrawer": {
        "type": "array",
        "description": "Trigger action when mobile menu drawer is toggled."
      },
      "onToggleMenuGroup": {
        "type": "array",
        "description": "Trigger action when mobile menu group is opened."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
