export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBUpdateMany',
  type: 'object',
  required: ['filter', 'update'],
  properties: {
    filter: {
      type: 'object',
      description: 'The filter used to select the documents to update.',
      errorMessage: {
        type: 'MongoDBUpdateMany request property "filter" should be an object.',
      },
    },
    update: {
      type: ['object', 'array'],
      description: 'The update operations to be applied to the documents.',
      errorMessage: {
        type: 'MongoDBUpdateMany request property "update" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBUpdateMany request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBUpdateMany request properties should be an object.',
    required: {
      filter: 'MongoDBUpdateMany request should have required property "filter".',
      update: 'MongoDBUpdateMany request should have required property "update".',
    },
  },
};
