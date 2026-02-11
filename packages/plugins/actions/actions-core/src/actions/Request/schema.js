export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Shorthand for a single requestId.',
      },
      {
        type: 'array',
        items: { type: 'string' },
        description: 'An array of requestIds to call.',
      },
      {
        type: 'object',
        description: 'Request parameters.',
      },
    ],
  },
};
