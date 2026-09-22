export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['key'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        description: 'The local storage key to read.',
      },
      default: {
        description: 'The value returned when the key is not set in local storage.',
      },
    },
    additionalProperties: false,
  },
};
