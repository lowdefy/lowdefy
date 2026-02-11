export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['copy'],
    properties: {
      copy: {
        type: 'string',
        description: 'The text to copy to the clipboard.',
      },
    },
    additionalProperties: false,
  },
};
