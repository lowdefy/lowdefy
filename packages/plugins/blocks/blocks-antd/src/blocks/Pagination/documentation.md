<TITLE>
Pagination
</TITLE>

<DESCRIPTION>

The `Pagination` controls user input for pagination purposes.

> This block does not paginate requests, it only manage pagination parameters which can be used to control pagination requests.

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "total": {
        "type": "integer",
        "default": 100,
        "description": "Total number of items to be displayed in pagination."
      },
      "size": {
        "type": "string",
        "enum": ["small", "default"],
        "default": "default",
        "description": "Pagination element size."
      },
      "simple": {
        "type": "boolean",
        "default": false,
        "description": "Use simplified pagination display."
      },
      "showTotal": {
        "type": ["boolean", "string", "object"],
        "default": false,
        "description": "Show pagination total number and range if boolean, or define a custom string or function to display.",
        "docs": {
          "displayType": "string"
        }
      },
      "showSizeChanger": {
        "type": "boolean",
        "default": false,
        "description": "Determine whether to show page size select, it will be true when total > 50."
      },
      "showQuickJumper": {
        "type": "boolean",
        "default": false,
        "description": "Determine whether you can jump to pages directly."
      },
      "pageSizeOptions": {
        "type": "array",
        "default": [10, 20, 30, 40],
        "description": "Specify the page size changer options.",
        "items": {
          "type": "number"
        }
      },
      "hideOnSinglePage": {
        "type": "boolean",
        "default": false,
        "description": "Hide pager on short list of a single page."
      },
      "disabled": {
        "type": "boolean",
        "default": false,
        "description": "Disable pager."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onSizeChange": {
        "type": "array",
        "description": "Triggered when page size is changed."
      },
      "onChange": {
        "type": "array",
        "description": "Triggered when current page is changed."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
