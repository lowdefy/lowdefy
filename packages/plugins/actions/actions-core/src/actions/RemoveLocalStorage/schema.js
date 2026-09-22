export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        description: 'The local storage key to remove.',
      },
    },
    additionalProperties: false,
  },
};
