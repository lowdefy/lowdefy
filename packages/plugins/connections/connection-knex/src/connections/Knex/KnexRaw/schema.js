export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - KnexRaw',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string',
      description: 'SQL query string.',
      errorMessage: {
        type: 'KnexRaw request property "query" should be a string.',
      },
    },
    parameters: {
      type: ['string', 'number', 'array', 'object'],
      description: 'SQL query parameters.',
      errorMessage: {
        type: 'KnexRaw request property "parameters" should be a string, number, array, or object.',
      },
    },
  },
  errorMessage: {
    type: 'KnexRaw request properties should be an object.',
    required: {
      query: 'KnexRaw request should have required property "query".',
    },
  },
};
