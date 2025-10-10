<TITLE>
GoogleSheetGetOne
</TITLE>

<DESCRIPTION>

The `GoogleSheetGetOne` request fetches a single rows from the spreadsheet. The `limit` and `skip` options can be used to control which documents are read from the spreadsheet. The filter option can then be used to filter or select which row is returned.

### Properties

- `filter: object`: A MongoDB query expression to filter the data.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `skip: number`: The number of rows to skip from the top of the sheet.

</DESCRIPTION>

<CONNECTION>
GoogleSheet
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - GoogleSheetGetOne',
  type: 'object',
  properties: {
    filter: {
      type: 'object',
      description: 'A MongoDB query expression to filter the data.',
      errorMessage: {
        type: 'GoogleSheetGetOne request property "filter" should be an object.',
      },
    },
    options: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The maximum number of rows to fetch.',
          errorMessage: {
            type: 'GoogleSheetGetOne request property "options.limit" should be a number.',
          },
        },
        skip: {
          type: 'number',
          description: 'The number of rows to skip from the top of the sheet.',
          errorMessage: {
            type: 'GoogleSheetGetOne request property "options.skip" should be a number.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetGetOne request properties should be an object.',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Get row where name is "Zarya"

```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetOne
    connectionId: google_sheets
    properties:
      filter:
        name:
          $eq: Zarya
```

</EXAMPLES>
