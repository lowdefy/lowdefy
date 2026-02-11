export default {
  type: 'object',
  params: {
    type: 'array',
    items: {
      type: 'number',
    },
    minItems: 2,
    maxItems: 2,
    description: 'Array of two numbers. Returns the first divided by the second.',
  },
};
