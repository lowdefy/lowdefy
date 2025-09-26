<TITLE>
MobileMenu
</TITLE>

<DESCRIPTION>

A menu designed for mobile devices. Renders a button that opens a Drawer with the menu inside. This menu is used by default in `PageHeaderMenu` and `PageSiderMenu` on mobile devices.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "toggleMenuButton": {
        "type": "object",
        "description": "Toggle menu button properties.",
        "docs": {
          "displayType": "button"
        }
      },
      "drawer": {
        "type": "object",
        "description": "Menu drawer properties.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "menuId": {
        "type": "string",
        "description": "App menu id used to get menu links."
      },
      "selectedKeys": {
        "type": "array",
        "description": "Array with the keys of currently selected menu items.",
        "items": {
          "type": "string",
          "description": "Selected menu item 'id'."
        }
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
      "onToggleDrawer": {
        "type": "array",
        "description": "Trigger action when mobile menu drawer is toggled."
      },
      "onClose": {
        "type": "array",
        "description": "Trigger action when mobile menu is closed."
      },
      "onOpen": {
        "type": "array",
        "description": "Trigger action when mobile menu is opened."
      },
      "onMenuItemSelect": {
        "type": "array",
        "description": "Trigger action when menu item is selected."
      },
      "onMenuItemClick": {
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
