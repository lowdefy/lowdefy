export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - MongoDBCollection',
  type: 'object',
  required: ['databaseUri', 'collection'],
  properties: {
    databaseUri: {
      type: 'string',
      description: 'Connection uri string for the MongoDb deployment.',
      errorMessage: {
        type: 'MongoDBCollection connection property "databaseUri" should be a string.',
      },
    },
    databaseName: {
      type: 'string',
      description: 'AWS IAM secret access key with s3 access.',
      errorMessage: {
        type: 'MongoDBCollection connection property "databaseName" should be a string.',
      },
    },
    collection: {
      type: 'string',
      description: 'AWS region the bucket is located in.',
      errorMessage: {
        type: 'MongoDBCollection connection property "collection" should be a string.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the collection.',
      errorMessage: {
        type: 'MongoDBCollection connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the collection.',
      errorMessage: {
        type: 'MongoDBCollection connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBCollection connection properties should be an object.',
    required: {
      databaseUri: 'MongoDBCollection connection should have required property "databaseUri".',
      collection: 'MongoDBCollection connection should have required property "collection".',
    },
  },
};
