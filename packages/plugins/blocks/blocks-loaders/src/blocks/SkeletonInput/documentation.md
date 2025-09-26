<TITLE>
SkeletonInput
</TITLE>

<DESCRIPTION>

The `SkeletonInput` block can be used as a loading skeleton for `Input` blocks.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "labelStyle": {
        "type": "object",
        "description": "Css style object to apply to the label skeleton.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "inputStyle": {
        "type": "object",
        "description": "Css style object to apply to the input skeleton.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "size": {
        "type": "string",
        "default": "medium",
        "description": "Size of the skeleton.",
        "enum": ["small", "medium", "large"]
      },
      "width": {
        "type": ["number", "string"],
        "description": "Width of the skeleton.",
        "docs": {
          "displayType": "string"
        }
      },
      "labelHeight": {
        "type": ["number", "string"],
        "description": "Height of the skeleton.",
        "docs": {
          "displayType": "string"
        }
      },
      "labelWidth": {
        "type": ["number", "string"],
        "description": "Width of the skeleton.",
        "docs": {
          "displayType": "string"
        }
      },
      "inputHeight": {
        "type": ["number", "string"],
        "description": "Height of the skeleton.",
        "docs": {
          "displayType": "string"
        }
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic skeleton input

```yaml
id: basic_skeleton_input_example
type: SkeletonInput
properties:
  inputHeight: 100
  labelHeight: 50
  labelWidth: 50
  size: large
  width: 100
```

</EXAMPLES>
