<TITLE>
GoogleSheetGetMany
</TITLE>

<DESCRIPTION>

The `GoogleSheetGetMany` request fetches a number of rows from the spreadsheet. The `limit` and `skip` options can be used to control which documents are read from the spreadsheet. The filter or pipeline options can then be used to filter or transform the fetched data.

### Properties

- `filter: object`: A MongoDB query expression to filter the data.
- `pipeline: object[]`: A MongoDB aggregation pipeline to transform the data.
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
  title: 'Lowdefy Request Schema - GoogleSheetGetMany',
  type: 'object',
  properties: {
    filter: {
      type: 'object',
      description: 'A MongoDB query expression to filter the data.',
      errorMessage: {
        type: 'GoogleSheetGetMany request property "filter" should be an object.',
      },
    },
    pipeline: {
      type: 'array',
      description: 'A MongoDB aggregation pipeline to transform the data.',
      errorMessage: {
        type: 'GoogleSheetGetMany request property "pipeline" should be an array.',
      },
    },
    options: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The maximum number of rows to fetch.',
          errorMessage: {
            type: 'GoogleSheetGetMany request property "options.limit" should be a number.',
          },
        },
        skip: {
          type: 'number',
          description: 'The number of rows to skip from the top of the sheet.',
          errorMessage: {
            type: 'GoogleSheetGetMany request property "options.skip" should be a number.',
          },
        },
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheetGetMany request properties should be an object.',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Get the first 10 rows

```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    properties:
      options:
        limit: 10
```

### Pagination using limit and skip

```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    payload:
      page_size:
        _state: page_size
      page_number:
        _state: page_number
    properties:
      options:
        skip:
          _product:
            - _payload: page_size
            - _subtract:
                - _payload: page_number
                - 1
        limit:
          _payload: page_size
```

### Get all records where age is greater than 25

```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    properties:
      filter:
        age:
          $gt: 25
```

### Use an aggregation pipeline to aggregate data

```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    properties:
      pipeline:
        - $group:
            _id: $region
            score:
              $avg: $score
        - $project:
            _id: 0
            region: $_id
            score: 1
        - $sort:
            score: 1
```

</EXAMPLES>
