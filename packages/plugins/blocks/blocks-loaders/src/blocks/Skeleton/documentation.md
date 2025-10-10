<TITLE>
Skeleton
</TITLE>

<DESCRIPTION>

The `Skeleton` block can be used as a regular block or as a loading skeleton for another block.

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
      "height": {
        "type": ["number", "string"],
        "description": "Height of the skeleton.",
        "docs": {
          "displayType": "string"
        }
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

### Basic skeleton

```yaml
id: basic_skeleton_example
type: Skeleton
properties:
  height: 100
  width: 100
```

### Loading skeleton for a card

```yaml
id: loading_skeleton_card_example
type: Card
loading: true
skeleton:
  type: Card
  blocks:
    - type: Skeleton
      properties:
        height: 100
```

</EXAMPLES>
