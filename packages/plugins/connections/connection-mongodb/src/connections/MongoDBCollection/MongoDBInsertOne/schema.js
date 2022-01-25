export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBInsertOne',
  type: 'object',
  required: ['doc'],
  properties: {
    doc: {
      type: 'object',
      description: 'The document to be inserted.',
      errorMessage: {
        type: 'MongoDBInsertOne request property "doc" should be an object.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBInsertOne request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBInsertOne request properties should be an object.',
    required: 'MongoDBInsertOne request should have required property "doc".',
  },
};
