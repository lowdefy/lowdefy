<TITLE>
Result
</TITLE>

<DESCRIPTION>

Used to provide feedback the results of a task or error.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "icon": {
        "type": ["string", "object"],
        "description": "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize icon to use as result image.",
        "docs": {
          "displayType": "icon"
        }
      },
      "status": {
        "type": "string",
        "enum": ["success", "error", "info", "warning", "404", "403", "500"],
        "default": "info",
        "description": "Status of the result. Determines image and color."
      },
      "subTitle": {
        "type": "string",
        "description": "Result subtitle or secondary text - supports html."
      },
      "title": {
        "type": "string",
        "description": "Result title or primary text - supports html."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

### 500 Error

```yaml
id: error_example
type: Result
properties:
  status: 500
  title: An error occurred
```

</EXAMPLES>
