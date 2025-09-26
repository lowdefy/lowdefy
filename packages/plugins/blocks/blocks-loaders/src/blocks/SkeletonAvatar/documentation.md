<TITLE>
SkeletonAvatar
</TITLE>

<DESCRIPTION>

The `SkeletonAvatar` block can be used as a loading skeleton for an `Avatar` block.

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
      "shape": {
        "type": "string",
        "default": "round",
        "description": "Shape of the skeleton.",
        "enum": ["square", "round"]
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

### Basic skeleton avatar

```yaml
id: basic_skeleton_avatar_example
type: SkeletonAvatar
properties:
  shape: square
  size: large
```

</EXAMPLES>
