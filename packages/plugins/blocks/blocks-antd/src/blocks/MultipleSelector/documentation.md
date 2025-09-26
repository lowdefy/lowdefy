<TITLE>
MultipleSelector
</TITLE>

<DESCRIPTION>

The `MultipleSelector` block is a drop down selector that allows a user to select multiple values from a set of options.

The options for the selector can be provides as either an array of primitive values (Strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

> Other selector blocks are `ButtonSelector`, `CheckboxSelector`, `RadioSelector` and `Selector`.

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
      "autoClearSearchValue": {
        "type": "boolean",
        "default": true,
        "description": "Whether the current search will be cleared on selecting an item."
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
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable the block if true."
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
                },
                "tag": {
                  "type": "object",
                  "properties": {
                    "color": {
                      "type": "string",
                      "description": "Color of the Tag. Preset options are success, processing, error, warning, default, blue, cyan, geekblue, gold, green, lime, magenta, orange, purple, red, volcano, or alternatively any hex color.",
                      "docs": {
                        "displayType": "color"
                      }
                    },
                    "title": {
                      "type": "string",
                      "description": "Content title of tag - supports html."
                    },
                    "icon": {
                      "type": ["string", "object"],
                      "description": "Name of an Ant Design Icon or properties of an Icon block to customize alert icon.",
                      "docs": {
                        "displayType": "icon"
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      },
      "maxTagCount": {
        "type": "number",
        "description": "Max tag count to show."
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
      "selectedIcon": {
        "type": ["string", "object"],
        "default": "AiOutlineCheck",
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon showing when a selection is made in the drop-down list.",
        "docs": {
          "displayType": "icon"
        }
      },
      "showArrow": {
        "type": "boolean",
        "default": true,
        "description": "Show the suffix icon at the drop-down position of the selector."
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
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize at the drop-down position of the selector.",
        "docs": {
          "displayType": "icon"
        }
      },
      "title": {
        "type": "string",
        "description": "Multiple selector label title - supports html."
      },
      "renderTags": {
        "type": "boolean",
        "description": "When true, the selected option labels are rendered as tags in the selector input. This field must be true to render option tag values."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onChange": {
        "type": "array",
        "description": "Trigger actions when selection is changed."
      },
      "onBlur": {
        "type": "array",
        "description": "Trigger action event occurs when selector loses focus."
      },
      "onFocus": {
        "type": "array",
        "description": "Trigger action when selector gets focus."
      },
      "onClear": {
        "type": "array",
        "description": "Trigger action when selector gets cleared."
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

### Basic MultipleSelector Usage

```yaml
id: basic_selector
type: MultipleSelector
properties:
  options:
    - Option A
    - Option B
    - Option C
  title: Select options
```

### MultipleSelector with label value options

```yaml
id: label_value_selector
type: MultipleSelector
properties:
  options:
    - label: Option 1
      value: 1
    - label: Option 2
      value: 2
    - label: Option 3
      value: 3
  title: Select options
```

### MultipleSelector with html label value options

```yaml
id: label_value_selector
type: MultipleSelector
properties:
  options:
    - label: |
        <div style="font-weight: bold;">Max Verstappen</div>
        <div style="font-size: 0.7em;">Red Bull Racing</div>
      value: 1
    - label: |
        <div style="font-weight: bold;">Logan Sargeant</div>
        <div style="font-size: 0.7em;">Williams</div>
      value: 2
    - label: |
        <div style="font-weight: bold;">Daniel Ricciardo</div>
        <div style="font-size: 0.7em;">AlphaTauri</div>
      value: 3
  title: Select options
```

### MultipleSelector that renders Tags for selected values

```yaml
id: label_value_selector
type: MultipleSelector
properties:
  options:
    - label: |
        <div style="font-weight: bold;">Max Verstappen</div>
        <div style="font-size: 0.7em;">Red Bull Racing</div>
      tag:
        color: red
        title: Max
      value: 1
    - label: |
        <div style="font-weight: bold;">Logan Sargeant</div>
        <div style="font-size: 0.7em;">Williams</div>
      tag:
        color: blue
        title: Logan
      value: 2
    - label: |
        <div style="font-weight: bold;">Daniel Ricciardo</div>
        <div style="font-size: 0.7em;">AlphaTauri</div>
      tag:
        color: magenta
        title: Daniel
      value: 3
  renderTags: true
  title: Select options
```

### Listing options from database search

```yaml
id: example_selector
type: MultipleSelector
properties:
  label:
    disabled: true
  options:
    _array.concat:
      - _if_none:
        - _state: example_options
        - []
      - _if_none:
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
                        - _payload: search_input
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
  onChange:
    - id: set_state
      type: SetState
      params:
        example_options:
          _mql.aggregate:
            true:
              _array.concat:
                - _state: example_options
                - _request: example_search
            pipeline:
              - $match:
                  value:
                    $in:
                      _state: example_selector
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
