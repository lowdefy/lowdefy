<TITLE>
GoogleSheetAppendOne
</TITLE>

<DESCRIPTION>

The `GoogleSheetAppendOne` request inserts a documents as a row in a Google Sheet.

### Properties

- `row: object`: __Required__ - The row to insert into the sheet. An object where keys are the column names and values are the values to insert.
- `options: object`: Optional settings. Supported settings are:
  - `raw: boolean`: Store raw values instead of converting as if typed into the sheets UI.

</DESCRIPTION>

<CONNECTION>
GoogleSheet
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - GoogleSheetAppendOne',
  type: 'object',
  required: ['row'],
  properties: {
    row: {
      type: 'object',
      description:
        'The row to insert into the sheet. An object where keys are the column names and values are the values to insert.',
      errorMessage: {
        type: 'GoogleSheetAppendOne request property "row" should be an object.',
      },
    },
    options: {
      type: 'object',
      properties: {
        raw: {
          type: 'boolean',
          description: 'Store raw values instead of converting as if typed into the sheets UI.',
          errorMessage: {
            type: 'GoogleSheetAppendOne request property "options.raw" should be a boolean.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetAppendOne request properties should be an object.',
    required: {
      row: 'GoogleSheetAppendOne request should have required property "row".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Insert a single row

```yaml
requests:
  - id: insert_dva
    type:  GoogleSheetAppendOne
    connectionId: google_sheets
    properties:
      row:
        name: D.Va
        role: Tank
        real_name: Hana Song
        age: 19
```

</EXAMPLES>
