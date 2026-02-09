export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['ms'],
    properties: {
      ms: {
        type: 'integer',
        description: 'Time to wait in milliseconds.',
      },
    },
    additionalProperties: false,
  },
};
