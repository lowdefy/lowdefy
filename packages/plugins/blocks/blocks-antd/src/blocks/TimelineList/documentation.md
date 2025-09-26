<TITLE>
TimelineList
</TITLE>

<DESCRIPTION>

The TimelineList block renders a content area for all items in the array. All list blocks create a array in state at their block `id`. The list content areas are rendered for each index in the array. See the [List Concept](/lists) page for a detailed description on how to work with lists.

The timeline nodes can be customized based on the array data.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "data": {
        "type": "array",
        "docs": {
          "displayType": "yaml"
        }
      },
      "style": {
        "type": "object",
        "description": "Css style object to apply to timeline.",
        "docs": {
          "displayType": "yaml"
        }
      },
      "pendingDotIcon": {
        "type": ["object", "string"],
        "description": "Set the dot of the last ghost node when pending is true.",
        "docs": {
          "displayType": "icon"
        }
      },
      "pending": {
        "type": "boolean",
        "default": false,
        "description": "Set the last ghost node's existence or its content."
      },
      "reverse": {
        "type": "boolean",
        "default": false,
        "description": "Reverse timeline nodes."
      },
      "iconField": {
        "type": "string",
        "description": "Use a custom icon field. Defaults to 'icon'."
      },
      "styleField": {
        "type": "string",
        "description": "Use a custom style field. Defaults to 'style'."
      },
      "colorField": {
        "type": "string",
        "description": "Use a custom color field. Defaults to 'color'."
      },
      "positionField": {
        "type": "string",
        "description": "Use a custom position field. Defaults to 'position'."
      },
      "labelField": {
        "type": "string",
        "description": "Use a custom label field. Defaults to 'label'."
      },
      "mode": {
        "type": "string",
        "enum": ["left", "right", "alternate"],
        "default": "left",
        "description": "By sending alternate the timeline will distribute the nodes to the left and right."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Shipment Event Log

```yaml
id: shipment_events
type: TimelineList
blocks:
  - id: todo_input
    type: TextInput
    layout:
      grow: 1
    properties:
      label:
        disabled: true
      placeholder: Write something todo...
```

</EXAMPLES>
