export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Shorthand for a single blockId to validate.',
      },
      {
        type: 'array',
        items: { type: 'string' },
        description: 'An array of blockIds to validate.',
      },
    ],
  },
};
