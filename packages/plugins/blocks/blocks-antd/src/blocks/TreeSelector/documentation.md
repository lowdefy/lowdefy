<TITLE>
TreeSelector
</TITLE>

<DESCRIPTION>

The `TreeSelector` block allows a user to display, collapse and select a single node from a hierarchical list in a tree structure.

The options for the selector can be provided as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

The value in state is an array of values with the selected node value first followed by any parent node values.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "checkable": {
        "type": "boolean",
        "default": false,
        "description": "Make nodes checkboxes."
      },
      "inputStyle": {
        "type": "object",
        "description": "Css style to applied to input.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "optionsStyle": {
        "type": "object",
        "description": "Css style to applied to option elements.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "showLine": {
        "type": "boolean",
        "default": false,
        "description": "Show a connecting line if true."
      },
      "selectable": {
        "type": "boolean",
        "default": true,
        "description": "Selectable if true."
      },
      "options": {
        "default": [],
        "oneOf": [
          {
            "type": "array",
            "description": "Options can either be an array of label, value pairs.",
            "items": {
              "type": "object",
              "required": ["value"],
              "properties": {
                "label": {
                  "type": "string",
                  "description": "Value label shown to user - supports html."
                },
                "value": {
                  "description": "Value selected. Can be of any type.",
                  "oneOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "boolean"
                    },
                    {
                      "type": "object"
                    },
                    {
                      "type": "array"
                    }
                  ],
                  "docs": {
                    "displayType": "yaml"
                  }
                },
                "disabled": {
                  "type": "boolean",
                  "description": "Disable the node if true.",
                  "default": false
                },
                "disableCheckbox": {
                  "type": "boolean",
                  "description": "Disable the checkbox if true.",
                  "default": false
                },
                "style": {
                  "type": "object",
                  "description": "Css style to applied to option.",
                  "docs": {
                    "displayType": "yaml"
                  }
                },
                "children": {
                  "type": "array",
                  "description": "Options can either be an array of label, value pairs.",
                  "items": {
                    "type": "object",
                    "required": ["value"],
                    "properties": {
                      "label": {
                        "type": "string",
                        "description": "Value label shown to user - supports html."
                      },
                      "value": {
                        "description": "Value selected. Can be of any type.",
                        "oneOf": [
                          {
                            "type": "string"
                          },
                          {
                            "type": "number"
                          },
                          {
                            "type": "boolean"
                          },
                          {
                            "type": "object"
                          },
                          {
                            "type": "array"
                          }
                        ],
                        "docs": {
                          "displayType": "yaml"
                        }
                      },
                      "disabled": {
                        "type": "boolean",
                        "description": "Disable the node if true.",
                        "default": false
                      },
                      "disableCheckbox": {
                        "type": "boolean",
                        "description": "Disable the checkbox if true.",
                        "default": false
                      },
                      "style": {
                        "type": "object",
                        "description": "Css style to applied to option.",
                        "docs": {
                          "displayType": "yaml"
                        }
                      }
                    }
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
      "onChange": {
        "type": "array",
        "description": "Trigger action when selection is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Tree list of type and category with connecting line and single select.

```yaml
id: tree_list_type_category
type: TreeSelector
properties:
  options:
    - children:
      - label: One
        value: 1
      - label: Two
        value: 2
      - label: Three
        value: 3
      label: Type
      value: type
    - children:
      - label: One
        value: 1
      - label: Two
        value: 2
      - label: Three
        value: 3
      label: Category
      value: category
  showLine: true
```

</EXAMPLES>
