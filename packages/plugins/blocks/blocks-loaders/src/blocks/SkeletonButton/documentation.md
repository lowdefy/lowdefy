<TITLE>
SkeletonButton
</TITLE>

<DESCRIPTION>

The `SkeletonButton` block can be used as a loading skeleton for a `Button` block.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "style": {
        "type": "object",
        "description": "Css style object to apply to the skeleton.",
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

### Basic skeleton button

```yaml
id: basic_skeleton_example
type: SkeletonButton
properties:
  size: small
  width: 100
```

</EXAMPLES>
