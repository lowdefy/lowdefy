<TITLE>
Tag
</TITLE>

<DESCRIPTION>

A block to render a Tag component.

Besides hex color values, the following color preset values are available:

- `success`
- `processing`
- `error`
- `warning`
- `default`
- `blue`
- `cyan`
- `geekblue`
- `gold`
- `green`
- `lime`
- `magenta`
- `orange`
- `purple`
- `red`
- `volcano`

</DESCRIPTION>

<SCHEMA>

```json
{
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "closable": {
        "type": "boolean",
        "default": false,
        "description": "Allow tag to be closed."
      },
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
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onClick": {
        "type": "array",
        "description": "Called when Tag is clicked."
      },
      "onClose": {
        "type": "array",
        "description": "Called when Tag close icon is clicked."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Basic Tag

```yaml
id: basic_example
type: Tag
properties:
  title: A tag with title
```

### Preset color tags and icons

```yaml
id: error_tag
type: Tag
properties:
  color: error
  icon: AiOutlineCloseCircle
  title: Error
```

</EXAMPLES>
