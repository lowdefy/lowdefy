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
