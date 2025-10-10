<TITLE>
SkeletonParagraph
</TITLE>

<DESCRIPTION>

The `SkeletonParagraph` block can be used as a loading skeleton for a `Paragraph` block.

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
      "lines": {
        "type": "number",
        "default": 4,
        "description": "Number of paragraph lines of the skeleton."
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

### Basic skeleton paragraph

```yaml
id: basic_skeleton_paragraph_example
type: SkeletonParagraph
properties:
  lines: 5
  width: 100
```

</EXAMPLES>
