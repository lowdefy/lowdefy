<TITLE>
Menu
</TITLE>

<DESCRIPTION>

A menu block used to display page links.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "expandIcon": {
        "type": ["string", "object"],
        "description": "Menu expand icon.",
        "docs": {
          "displayType": "icon"
        }
      },
      "menuId": {
        "type": "string",
        "description": "App menu id used to get menu links."
      },
      "mode": {
        "type": "string",
        "enum": ["vertical", "horizontal", "inline"],
        "default": "vertical",
        "description": "Type of menu to render."
      },
      "selectedKeys": {
        "type": "array",
        "description": "Array with the keys of currently selected menu items.",
        "items": {
          "type": "string",
          "description": "A menu item 'id' to be displayed as selected."
        }
      },
      "defaultOpenKeys": {
        "type": "array",
        "description": "Array with the keys of default opened sub menus.",
        "items": {
          "type": "string",
          "description": "A menu item 'id' which should be open by default."
        }
      },
      "forceSubMenuRender": {
        "type": "boolean",
        "description": "Render submenu into DOM before it becomes visible.",
        "default": false
      },
      "subMenuCloseDelay": {
        "type": "number",
        "description": "Delay time to hide submenu when mouse leaves (in seconds)."
      },
      "subMenuOpenDelay": {
        "type": "number",
        "description": "Delay time to show submenu when mouse enters (in seconds)."
      },
      "theme": {
        "type": "string",
        "enum": ["dark", "light"],
        "default": "dark",
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
            "type": {
              "type": "string",
              "enum": ["MenuDivider", "MenuLink", "MenuGroup"],
              "default": "MenuLink",
              "description": "Menu item type."
            },
            "pageId": {
              "type": "string",
              "description": "Page to link to."
            },
            "style": {
              "type": "object",
              "description": "Css style to applied to link.",
              "docs": {
                "displayType": "yaml"
              }
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
                },
                "danger": {
                  "type": "boolean",
                  "default": false,
                  "description": "Apply danger style to menu item."
                },
                "dashed": {
                  "type": "boolean",
                  "default": false,
                  "description": "Whether the divider line is dashed."
                }
              }
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
                  "type": {
                    "type": "string",
                    "enum": ["MenuDivider", "MenuLink", "MenuGroup"],
                    "default": "MenuLink",
                    "description": "Menu item type."
                  },
                  "style": {
                    "type": "object",
                    "description": "Css style to applied to sub-link.",
                    "docs": {
                      "displayType": "yaml"
                    }
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
                      "danger": {
                        "type": "boolean",
                        "default": false,
                        "description": "Apply danger style to menu item."
                      },
                      "dashed": {
                        "type": "boolean",
                        "default": false,
                        "description": "Whether the divider line is dashed."
                      }
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
                          "type": {
                            "type": "string",
                            "enum": ["MenuDivider", "MenuLink"],
                            "default": "MenuLink",
                            "description": "Menu item type."
                          },
                          "style": {
                            "type": "object",
                            "description": "Css style to applied to sub-link.",
                            "docs": {
                              "displayType": "yaml"
                            }
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
                              "danger": {
                                "type": "boolean",
                                "default": false,
                                "description": "Apply danger style to menu item."
                              },
                              "dashed": {
                                "type": "boolean",
                                "default": false,
                                "description": "Whether the divider line is dashed."
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onSelect": {
        "type": "array",
        "description": "Trigger action when menu item is selected."
      },
      "onClick": {
        "type": "array",
        "description": "Trigger action when menu item is clicked."
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
