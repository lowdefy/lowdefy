export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - KnexBuilder',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'array',
      description:
        'SQL query builder array. An array of objects, with a single key which is the name of the knex builder function. The value should be an array of arguments to pass to the builder function.',
      errorMessage: {
        type: 'KnexBuilder request property "query" should be an array.',
      },
    },
    tableName: {
      type: ['string', 'object'],
      description: 'The name of the table to query from.',
      errorMessage: {
        type: 'KnexBuilder request property "tableName" should be a string or object',
      },
    },
  },
  errorMessage: {
    type: 'KnexBuilder request properties should be an object.',
    required: {
      query: 'KnexBuilder request should have required property "query".',
    },
  },
};
