<TITLE>
Statistic
</TITLE>

<DESCRIPTION>

A statistic block renders indicator numbers.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "decimalSeparator": {
        "type": "string",
        "default": ".",
        "description": "Decimal separator."
      },
      "groupSeparator": {
        "type": "string",
        "default": ",",
        "description": "Group separator."
      },
      "loading": {
        "type": "boolean",
        "default": false,
        "description": "Control the loading status of Statistic."
      },
      "precision": {
        "type": "number",
        "description": "Number of decimals to display."
      },
      "prefix": {
        "type": "string",
        "description": "Prefix text, priority over prefixIcon."
      },
      "prefixIcon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon which prefix the statistic.",
        "docs": {
          "displayType": "icon"
        }
      },
      "suffix": {
        "type": "string",
        "description": "Suffix text, priority over suffixIcon."
      },
      "suffixIcon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon which suffix the statistic.",
        "docs": {
          "displayType": "icon"
        }
      },
      "title": {
        "type": "string",
        "description": "Title to describe the component - supports html."
      },
      "value": {
        "oneOf": [
          {
            "type": "number",
            "description": "Value to display.",
            "step": "0.01"
          },
          {
            "type": "string",
            "description": "Value to display."
          }
        ]
      },
      "valueStyle": {
        "type": "object",
        "description": "Css style to applied to value.",
        "docs": {
          "displayType": "yaml"
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic statistic

```yaml
id: basic_example
type: Statistic
properties:
  prefixIcon: AiOutlineAlert
  value: 99.5
```

</EXAMPLES>
