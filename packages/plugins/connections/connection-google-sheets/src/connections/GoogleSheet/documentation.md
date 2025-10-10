<TITLE>
GoogleSheet
</TITLE>

<DESCRIPTION>

The `GoogleSheet` connection offers the flexibility to connect to Google Sheets using either an API key or a service account. While an API key is suitable for read-only access to public sheets, most applications will benefit more from using a service account, which offers broader capabilities. For detailed instructions on creating a service account, you can refer to the [Google Sheets API Quickstart Guide](https://developers.google.com/sheets/api/quickstart/js) and the [Google Workspace Guide on Creating a Project](https://developers.google.com/workspace/guides/create-project).

This connection refers to the entire document as the `spreadsheet`, and the individual sheets in the document as `sheets`. The spreadsheet is identified by it's `spreadsheetId`, and sheets can either be identified by their `sheetId` or their `index` (position in the document starting from 0).

When a sheet is accessed in a browser the url either looks like:
`https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid={sheetId}`

The `GoogleSheet` connection works with sheets as a row based data store. Each row is a data record, and a header row needs to be present to define the column names. This header needs to be created in the Google Sheets web interface. Types can be specified for any of the columns in the sheet. If a type is not specified, the value will be read as a string. The `json` type will stringify a object as JSON before saving it, and parse it again when reading.

### Properties

- `apiKey: string`: API key for your google project.
- `client_email: string`: The email address of your service account.
- `private_key: string`: The private key for your service account. Base64 encode the string if you have issues with the newline characters in the string.
- `sheetId: string`: The ID of the worksheet. Can be found in the URL as the "gid" parameter. One of `sheetId` or `sheetIndex` is required.
- `sheetIndex: number`: The position of the worksheet as they appear in the Google sheets UI. Starts from 0. One of `sheetId` or `sheetIndex` is required.
- `spreadsheetId: string`: __Required__ - The document ID from the URL of the spreadsheet.
- `columnTypes: object`: An object that defines the data types for each column. Each key should be the column name, and the value should be one of: `string`, `number`, `boolean`, `date`, or `json`.
- `read: boolean`: Default: `true` - Allow read operations like find on the sheet.
- `write: boolean`: Default: `false` - Allow write operations like update on the sheet.

</DESCRIPTION>

<REQUESTS>

- GoogleSheetAppendMany
- GoogleSheetAppendOne
- GoogleSheetDeleteOne
- GoogleSheetGetMany
- GoogleSheetGetOne
- GoogleSheetUpdateMany
- GoogleSheetUpdateOne

</REQUESTS>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - GoogleSheet',
  type: 'object',
  required: ['spreadsheetId'],
  properties: {
    apiKey: {
      type: 'string',
      description: 'API key for your google project.',
      errorMessage: {
        type: 'GoogleSheet connection property "apiKey" should be a string.',
      },
    },
    client_email: {
      type: 'string',
      description: 'The email of your service account.',
      errorMessage: {
        type: 'GoogleSheet connection property "client_email" should be a string.',
      },
    },
    private_key: {
      type: 'string',
      description: 'The private key for your service account.',
      errorMessage: {
        type: 'GoogleSheet connection property "private_key" should be a string.',
      },
    },
    sheetId: {
      type: 'string',
      description:
        'The ID of the worksheet. Can be found in the URL as the "gid" parameter. One of "sheetId" or "sheetIndex" is required.',
      errorMessage: {
        type: 'GoogleSheet connection property "sheetId" should be a string.',
      },
    },
    sheetIndex: {
      type: 'number',
      description:
        'The position of the worksheet as they appear in the Google sheets UI. Starts from 0. One of "sheetId" or "sheetIndex" is required.',
      errorMessage: {
        type: 'GoogleSheet connection property "sheetIndex" should be a number.',
      },
    },
    spreadsheetId: {
      type: 'string',
      description: 'document ID from the URL of the spreadsheet.',
      errorMessage: {
        type: 'GoogleSheet connection property "spreadsheetId" should be a string.',
      },
    },
    columnTypes: {
      type: 'object',
      description: 'Define types for columns in the spreadsheet.',
      patternProperties: {
        '^.*$': {
          type: 'string',
          enum: ['string', 'number', 'boolean', 'date', 'json'],
          errorMessage: {
            enum: 'GoogleSheet connection property "{{ instancePath }}" should be one of "string", "number", "boolean", "date", or "json".',
          },
        },
      },
      errorMessage: {
        type: 'GoogleSheet connection property "columnTypes" should be an object.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the spreadsheet.',
      errorMessage: {
        type: 'GoogleSheet connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the spreadsheet.',
      errorMessage: {
        type: 'GoogleSheet connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'GoogleSheet connection properties should be an object.',
    required: {
      spreadsheetId: 'GoogleSheet connection should have required property "spreadsheetId".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Read only access to first sheet in a public spreadsheet

```yaml
connections:
  - id: public_sheet
    type: GoogleSheet
    properties:
      apiKey:
        _secret: GOOGLE_SHEETS_API_KEY
      sheetIndex: 0
      spreadsheetId: ubQsWYNGRUq0gFB1sAp2r9oYE19lZ8yGA1T6y0yBoLPW
```

### Access with a service account, with defined types

```yaml
connections:
  - id: my_sheet
    type: GoogleSheet
    properties:
      client_email:
        _secret: GOOGLE_SHEETS_CLIENT_EMAIL
      private_key:
        _base64.decode:
          _secret: GOOGLE_SHEETS_PRIVATE_KEY
      sheetId: '1199545345'
      spreadsheetId: ubQsWYNGRUq0gFB1sAp2r9oYE19lZ8yGA1T6y0yBoLPW
      columnTypes:
        name: string
        age: number
        birthday: date
        subscribed: boolean
        address: json
```

</EXAMPLES>
