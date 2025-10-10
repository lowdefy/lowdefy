<TITLE>
Descriptions
</TITLE>

<DESCRIPTION>

Display multiple read-only fields in groups. Commonly used to display a detailed set of data.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "bordered": {
        "type": "boolean",
        "default": false,
        "description": "Render items in a table."
      },
      "colon": {
        "type": "boolean",
        "default": true,
        "description": "Include a colon in item labels."
      },
      "contentStyle": {
        "type": "object",
        "description": "Customize content style.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "column": {
        "default": 3,
        "oneOf": [
          {
            "type": "number",
            "description": "The number of description items in a row."
          },
          {
            "type": "object",
            "properties": {
              "xs": {
                "type": "integer",
                "description": "The number of description items in a row for 'xs' media size."
              },
              "sm": {
                "type": "integer",
                "description": "The number of description items in a row for 'sm' media size."
              },
              "md": {
                "type": "integer",
                "description": "The number of description items in a row for 'md' media size."
              },
              "lg": {
                "type": "integer",
                "description": "The number of description items in a row for 'lg' media size."
              },
              "xl": {
                "type": "integer",
                "description": "The number of description items in a row for 'xl' media size."
              }
            }
          }
        ]
      },
      "itemOptions": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["key"],
          "properties": {
            "key": {
              "type": "string",
              "description": "Item key to which these settings should apply."
            },
            "span": {
              "type": ["number", "object"],
              "description": "Item span for this key. Can also be a function that receives item and index.",
              "docs": {
                "displayType": "number"
              }
            },
            "style": {
              "type": "object",
              "description": "Item css style for this key. Can also be a function that receives item and index.",
              "docs": {
                "displayType": "yaml"
              }
            },
            "transformLabel": {
              "type": "object",
              "description": "Function to transform item key or label. Function receives arguments label, item and index.",
              "docs": {
                "displayType": "yaml"
              }
            },
            "transformValue": {
              "type": "object",
              "description": "Function to transform item value. Function receives arguments value, item and index.",
              "docs": {
                "displayType": "yaml"
              }
            }
          }
        }
      },
      "items": {
        "oneOf": [
          {
            "type": "array",
            "description": "List of items to display",
            "items": {
              "type": "object",
              "required": ["label"],
              "properties": {
                "contentStyle": {
                  "type": "object",
                  "description": "Customize content style.",
                  "docs": {
                    "displayType": "yaml"
                  }
                },
                "labelStyle": {
                  "type": "object",
                  "description": "Customize label style.",
                  "docs": {
                    "displayType": "yaml"
                  }
                },
                "label": {
                  "type": "string",
                  "description": "Item label - supports html."
                },
                "value": {
                  "oneOf": [
                    {
                      "type": "string",
                      "description": "Value of item - supports html."
                    },
                    {
                      "type": "number",
                      "description": "Value of item - supports html."
                    }
                  ]
                },
                "span": {
                  "type": "integer",
                  "description": "Number of columns for this item to span."
                },
                "style": {
                  "type": "object",
                  "description": "Css style object to applied to item.",
                  "docs": {
                    "displayType": "yaml"
                  }
                }
              }
            }
          },
          {
            "type": "object",
            "description": "Object of key value pairs to display",
            "docs": {
              "displayType": "yaml"
            }
          }
        ]
      },
      "labelStyle": {
        "type": "object",
        "description": "Customize label style.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "layout": {
        "type": "string",
        "description": "Put values next to or below their labels.",
        "enum": ["horizontal", "vertical"],
        "default": "horizontal"
      },
      "size": {
        "type": "string",
        "description": "Size of the block.",
        "enum": ["default", "small"],
        "default": "default"
      },
      "title": {
        "type": "string",
        "description": "The title of the description block, placed at the top - supports html."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Object data example

```yaml
id: object_example
type: Descriptions
properties:
  bordered: true
  items:
    Date: 2021-02-02
    Location: South Africa
    Temperature: 22
```

</EXAMPLES>
