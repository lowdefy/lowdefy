export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['test'],
    properties: {
      test: {
        type: 'boolean',
        description: 'Boolean condition to evaluate.',
      },
      then: {
        description: 'Value returned when test is true.',
      },
      else: {
        description: 'Value returned when test is false.',
      },
    },
    additionalProperties: false,
  },
};
