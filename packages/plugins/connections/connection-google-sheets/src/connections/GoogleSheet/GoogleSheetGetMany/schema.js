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
