export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['key', 'value'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        description: 'The local storage key to write to.',
      },
      value: {
        description:
          'The value to store. Values are serialized, so dates are preserved when read back with GetLocalStorage.',
      },
    },
    additionalProperties: false,
  },
};
