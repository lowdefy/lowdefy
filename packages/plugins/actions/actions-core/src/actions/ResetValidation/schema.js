export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Shorthand for a single blockId.',
      },
      {
        type: 'array',
        items: { type: 'string' },
        description: 'An array of blockIds to reset validation for.',
      },
    ],
  },
};
