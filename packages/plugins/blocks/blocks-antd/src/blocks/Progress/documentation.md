<TITLE>
Progress
</TITLE>

<DESCRIPTION>

Display the current progress as a percentage of completion.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "type": {
        "type": "string",
        "default": "line",
        "enum": ["line", "circle", "dashboard"],
        "description": "Set type of progress display."
      },
      "showInfo": {
        "type": "boolean",
        "default": true,
        "description": "Whether to display the progress value and the status icon."
      },
      "percent": {
        "type": "number",
        "default": 0,
        "description": "Set the completion percentage."
      },
      "status": {
        "type": "string",
        "enum": ["success", "exception", "normal", "active"],
        "default": "normal",
        "description": "Set the status of the Progress."
      },
      "strokeLinecap": {
        "type": "string",
        "default": "round",
        "enum": ["round", "square"],
        "description": "Set the style of the progress linecap."
      },
      "strokeColor": {
        "type": ["string", "object"],
        "description": "Color of progress bar.",
        "docs": {
          "displayType": "color"
        }
      },
      "success": {
        "type": "number",
        "default": 0,
        "description": "Segmented success percent."
      },
      "trailColor": {
        "type": "string",
        "description": "Color of unfilled part.",
        "docs": {
          "displayType": "color"
        }
      },
      "strokeWidth": {
        "type": "number",
        "description": "Set the width of the progress bar."
      },
      "width": {
        "type": "number",
        "default": 132,
        "description": "Set the canvas width of the circular progress."
      },
      "gapDegree": {
        "type": "number",
        "default": 75,
        "description": "The gap degree of half circle."
      },
      "gapPosition": {
        "type": "string",
        "enum": ["top", "bottom", "left", "right"],
        "default": "top",
        "description": "The gap position."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### Line progress

```yaml
id: line_example
type: Progress
properties:
  percent: 60
  status: active
  strokeColor: '#fcb900'
  type: line
```

### Circle progress

```yaml
id: circle_example
type: Progress
properties:
  percent: 60
  strokeColor: '#52c41a'
  type: circle
```

### Dashboard progress

```yaml
id: dashboard_example
type: Progress
properties:
  percent: 60
  strokeColor: '#1890ff'
  type: dashboard
```

</EXAMPLES>
