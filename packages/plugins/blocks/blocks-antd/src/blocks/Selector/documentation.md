<TITLE>
Selector
</TITLE>

<DESCRIPTION>

The `Selector` block is a drop down selector that allows a user to select a single value from a set of options.

The options for the selector can be provides as either an array of primitive values (Strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

> Other selector blocks are `ButtonSelector`, `CheckboxSelector`, `MultipleSelector` and `RadioSelector`.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "allowClear": {
        "type": "boolean",
        "default": true,
        "description": "Allow the user to clear the selected value, sets the value to null."
      },
      "autoFocus": {
        "type": "boolean",
        "default": false,
        "description": "Autofocus to the block on page load."
      },
      "bordered": {
        "type": "boolean",
        "default": true,
        "description": "Whether or not the selector has a border style."
      },
      "clearIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineCloseCircle",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon at far right position of the selector, shown when user is given option to clear input.",
        "docs": {
          "displayType": "icon"
        }
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
      "label": {
        "type": "object",
        "description": "Label properties.",
        "additionalProperties": false,
        "properties": {
          "align": {
            "type": "string",
            "enum": ["left", "right"],
            "default": "left",
            "description": "Align label left or right when inline."
          },
          "colon": {
            "type": "boolean",
            "default": true,
            "description": "Append label with colon."
          },
          "extra": {
            "type": "string",
            "description": "Extra text to display beneath the content - supports html."
          },
          "title": {
            "type": "string",
            "description": "Label title - supports html."
          },
          "span": {
            "type": "number",
            "description": "Label inline span."
          },
          "disabled": {
            "type": "boolean",
            "default": false,
            "description": "Hide input label."
          },
          "hasFeedback": {
            "type": "boolean",
            "default": true,
            "description": "Display feedback extra from validation, this does not disable validation."
          },
          "inline": {
            "type": "boolean",
            "default": false,
            "description": "Render input and label inline."
          },
          "extraStyle": {
            "type": "object",
            "description": "Css style to applied to label extra.",
            "docs": {
              "displayType": "yaml"
            }
          },
          "feedbackStyle": {
            "type": "object",
            "description": "Css style to applied to label feedback.",
            "docs": {
              "displayType": "yaml"
            }
          }
        }
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
      },
      "options": {
        "default": [],
        "oneOf": [
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs - supports html.",
            "items": {
              "type": "string"
            }
          },
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs.",
            "items": {
              "type": "number"
            }
          },
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs.",
            "items": {
              "type": "boolean"
            }
          },
          {
            "type": "array",
            "description": "Options can either be an array of primitive values, on an array of label, value pairs.",
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
                  "default": false,
                  "description": "Disable the option if true."
                },
                "filterString": {
                  "type": "string",
                  "description": "String to match against when filtering selector options during. If no filterString is provided the filter method matches against options.label."
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
        ]
      },
      "placeholder": {
        "type": "string",
        "default": "Select item",
        "description": "Placeholder text inside the block before user selects input."
      },
      "loadingPlaceholder": {
        "type": "string",
        "default": "Loading",
        "description": "Placeholder text to show in options while the block is loading."
      },
      "notFoundContent": {
        "type": "string",
        "default": "not Found",
        "description": "Placeholder text to show when list of options are empty."
      },
      "showArrow": {
        "type": "boolean",
        "default": true,
        "description": "Show the suffix icon at the drop-down position of the selector."
      },
      "showSearch": {
        "type": "boolean",
        "default": true,
        "description": "Make the selector options searchable."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default", "large"],
        "default": "default",
        "description": "Size of the block."
      },
      "suffixIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineDown",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon at the drop-down position of the selector.",
        "docs": {
          "displayType": "icon"
        }
      },
      "title": {
        "type": "string",
        "description": "Title to describe the input component, if no title is specified the block id is displayed - supports html."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onBlur": {
        "type": "array",
        "description": "Trigger action event occurs when selector loses focus."
      },
      "onChange": {
        "type": "array",
        "description": "Trigger action when selection is changed."
      },
      "onFocus": {
        "type": "array",
        "description": "Trigger action when selector gets focus."
      },
      "onClear": {
        "type": "array",
        "description": "Trigger action when selector is cleared."
      },
      "onSearch": {
        "type": "array",
        "description": "Trigger actions when input is changed. 'value' is passed to the _event operator to be used in actions such as search queries."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Listing options from database search

```yaml
id: example_selector
type: Selector
properties:
  label:
    disabled: true
  options:
    _if_none:
      - _request: example_search
      - []
  placeholder: Search
requests:
  - id: example_search
    type: MongoDBAggregation
    connectionId: companies
    payload:
      search_input:
        _state: search_input
    properties:
      pipeline:
        - $search:
            compound:
              should:
                - wildcard:
                    allowAnalyzedField: true
                    path:
                      - _id
                      - company_name
                    query:
                      _string.concat:
                        - '*'
                        - payload: search_input
                        - '*'
        - $addFields:
            score:
              $meta: searchScore
        - $sort:
            score: -1
        - $limit: 50
        - $project:
            _id: 0
            label:
              $concat:
                - $_id
                - ' - '
                - $ifNull:
                  - $company_name
                  - ''
            value: $_id
events:
  onSearch:
    debounce:
      ms: 500
    try:
      - id: set_state
        type: SetState
        params:
          search_input:
            _event: value
      - id: perform_search
        type: Request
        params: example_search
```

</EXAMPLES>
