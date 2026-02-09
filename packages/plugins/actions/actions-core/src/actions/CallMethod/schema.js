export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['blockId', 'method'],
    properties: {
      blockId: {
        type: 'string',
        description: 'The blockId of the block to call the method on.',
      },
      method: {
        type: 'string',
        description: 'The name of the method to call.',
      },
      args: {
        type: 'array',
        description: 'An array of arguments to pass to the method.',
      },
    },
    additionalProperties: false,
  },
};
