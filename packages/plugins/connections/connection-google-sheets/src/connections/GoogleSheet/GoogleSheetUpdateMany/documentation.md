<TITLE>
GoogleSheetUpdateMany
</TITLE>

<DESCRIPTION>

The `GoogleSheetUpdateMany` request updates all the rows matched by the filter.

### Properties

- `filter: object`: A MongoDB query expression to filter the data. . All rows matched by the filter will be updated.
- `update: object`: The update to apply to the row. An object where keys are the column names and values are the updated values.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `raw: boolean`: Store raw values instead of converting as if typed into the sheets UI.
  - `skip: number`: The number of rows to skip from the top of the sheet.

</DESCRIPTION>

<CONNECTION>
GoogleSheet
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - GoogleSheetUpdateMany',
  type: 'object',
  required: ['update', 'filter'],
  properties: {
    filter: {
      type: 'object',
      description:
        'A MongoDB query expression to filter the data. All rows matched by the filter will be updated.',
      errorMessage: {
        type: 'GoogleSheetUpdateMany request property "filter" should be an object.',
      },
    },
    update: {
      type: 'object',
      description:
        'The update to apply to the row. An object where keys are the column names and values are the updated values.',
      errorMessage: {
        type: 'GoogleSheetUpdateMany request property "update" should be an object.',
      },
    },
    options: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The maximum number of rows to fetch.',
          errorMessage: {
            type: 'GoogleSheetUpdateMany request property "options.limit" should be a number.',
          },
        },
        raw: {
          type: 'boolean',
          description: 'Store raw values instead of converting as if typed into the sheets UI.',
          errorMessage: {
            type: 'GoogleSheetUpdateMany request property "options.raw" should be a boolean.',
          },
        },
        skip: {
          type: 'number',
          description: 'The number of rows to skip from the top of the sheet.',
          errorMessage: {
            type: 'GoogleSheetUpdateMany request property "options.skip" should be a number.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetUpdateMany request properties should be an object.',
    required: {
      filter: 'GoogleSheetUpdateMany request should have required property "filter".',
      update: 'GoogleSheetUpdateMany request should have required property "update".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Update all rows where age is less than 18

```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetUpdateMany
    connectionId: google_sheets
    properties:
      filter:
        age:
          $lt: 18
      update:
        minor: true
```

</EXAMPLES>
