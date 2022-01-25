export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - MongoDBAggregation',
  type: 'object',
  required: ['pipeline'],
  properties: {
    pipeline: {
      type: 'array',
      description: 'Array containing all the aggregation framework commands for the execution.',
      errorMessage: {
        type: 'MongoDBAggregation request property "pipeline" should be an array.',
      },
    },
    options: {
      type: 'object',
      description: 'Optional settings.',
      errorMessage: {
        type: 'MongoDBAggregation request property "options" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'MongoDBAggregation request properties should be an object.',
    required: 'MongoDBAggregation request should have required property "pipeline".',
  },
};
