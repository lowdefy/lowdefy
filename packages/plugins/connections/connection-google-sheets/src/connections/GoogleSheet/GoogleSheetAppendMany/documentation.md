<TITLE>
GoogleSheetAppendMany
</TITLE>

<DESCRIPTION>

The `GoogleSheetAppendMany` request inserts an array of documents as rows in a Google Sheet.

### Properties

- `rows: object[]`: __Required__ - The rows to insert into the sheet. An an array of objects where keys are the column names and values are the values to insert.
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
  title: 'Lowdefy Request Schema - GoogleSheetAppendMany',
  type: 'object',
  required: ['rows'],
  properties: {
    rows: {
      type: 'array',
      description:
        'The rows to insert into the sheet. An an array of objects where keys are the column names and values are the values to insert.',
      errorMessage: {
        type: 'GoogleSheetAppendMany request property "rows" should be an array.',
      },
      items: {
        type: 'object',
        description:
          'The row to insert into the sheet. An object where keys are the column names and values are the values to insert.',
        errorMessage: {
          type: 'GoogleSheetAppendMany request property "rows" should be an array of objects.',
        },
      },
    },
    options: {
      type: 'object',
      properties: {
        raw: {
          type: 'boolean',
          description: 'Store raw values instead of converting as if typed into the sheets UI.',
          errorMessage: {
            type: 'GoogleSheetAppendMany request property "options.raw" should be a boolean.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetAppendMany request properties should be an object.',
    required: {
      rows: 'GoogleSheetAppendMany request should have required property "rows".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Insert a list of rows

```yaml
requests:
  - id: append_rows
    type:  GoogleSheetAppendMany
    connectionId: google_sheets
    properties:
      rows:
        - name: D.Va
          role: Tank
        - name: Tracer
          role: Damage
        - name: Genji
          role: Damage
        - name: Reinhart
          role: Tank
        - name: Mercy
          role: Support
```

</EXAMPLES>
