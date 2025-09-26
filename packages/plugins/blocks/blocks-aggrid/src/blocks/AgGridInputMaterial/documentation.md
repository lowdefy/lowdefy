<TITLE>
AgGridInputMaterial
</TITLE>

<DESCRIPTION>

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "properties": {
      "type": "object",
      "description": "AgGrid table properties object. See the Ag-Grid docs(https://www.ag-grid.com/documentation/react/getting-started/) for all the table settings API.",
      "properties": {
        "height": {
          "type": ["number", "string"],
          "default": "auto",
          "description": "Specify table height explicitly, in pixel."
        },
        "rowData": {
          "type": "array",
          "description": "The list of data to display on the table."
        },
        "rowId": {
          "type": "string",
          "description": "The data field to use in `getRowId` which results in Row Selection being maintained across Row Data changes (assuming the Row exists in both sets). See Ag Grid docs for more details (https://www.ag-grid.com/react-data-grid/data-update-row-data/)."
        },
        "defaultColDef": {
          "type": "object",
          "description": "Column properties which get applied to all columns. See all (https://www.ag-grid.com/javascript-data-grid/column-properties/)."
        },
        "columnDefs": {
          "type": "array",
          "description": "A list of properties for each column.",
          "items": {
            "type": "object",
            "properties": {
              "field": {
                "type": "string",
                "description": "The field of the row object to get the cell's data from. Deep references into a row object is supported via dot notation, i.e 'address.firstLine'."
              },
              "headerName": {
                "type": "string",
                "description": "The name to render in the column header. If not specified and field is specified, the field name will be used as the header name."
              },
              "editable": {
                "type": "boolean",
                "default": false,
                "description": "Set to true if this column is editable, otherwise false."
              },
              "rowDrag": {
                "type": ["boolean", "object"],
                "default": false,
                "description": "Set to true (or return true from function) to allow row dragging."
              },
              "filter": {
                "type": "boolean",
                "default": false,
                "description": "Filter component to use for this column. Set to true to use the default filter."
              },
              "sortable": {
                "type": "boolean",
                "default": false,
                "description": "Set to true to allow sorting on this column."
              },
              "resizable": {
                "type": "boolean",
                "default": false,
                "description": "Set to true to allow this column should be resized."
              },
              "width": {
                "type": "number",
                "description": "Initial width in pixels for the cell."
              },
              "cellStyle": {
                "type": "number",
                "description": "An object of css values returning an object of css values for a particular cell."
              },
              "cellRenderer": {
                "type": "object",
                "description": "Provide your own cell Renderer function (using the `_function` operator) for this column's cells."
              },
              "valueFormatter": {
                "type": ["object", "string"],
                "description": "A function (using the `_function` operator) or expression to format a value, should return a string. Not used for CSV export or copy to clipboard, only for UI cell rendering."
              }
            }
          }
        }
      },
      "events": {
        "type": "object",
        "properties": {
          "onCellClick": {
            "type": "array",
            "description": "Trigger event when a cell is clicked."
          },
          "onFilterChanged": {
            "type": "array",
            "description": "Trigger event when the filter changes."
          },
          "onRowClick": {
            "type": "array",
            "description": "Trigger event when a row is clicked."
          },
          "onRowSelected": {
            "type": "array",
            "description": "Trigger event when a row is selected."
          },
          "onSelectionChanged": {
            "type": "array",
            "description": "Triggered when the selected rows are changed."
          },
          "onSortChanged": {
            "type": "array",
            "description": "Trigger event when the sort changes."
          },
          "onCellValueChanged": {
            "type": "array",
            "description": "Triggered when a cell value is changed on the grid."
          },
          "onRowDragEnd": {
            "type": "array",
            "description": "Triggered when a row is dragged to another position in the grid."
          }
        }
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
