export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['from'],
    properties: {
      from: {
        description: 'Object or array to get value from.',
      },
      key: {
        type: 'string',
        description: 'Dot-notation path to the value.',
      },
      default: {
        description: 'Default value if key does not exist.',
      },
      all: {
        type: 'boolean',
        description: 'Return all matching values.',
      },
    },
    additionalProperties: false,
  },
};
