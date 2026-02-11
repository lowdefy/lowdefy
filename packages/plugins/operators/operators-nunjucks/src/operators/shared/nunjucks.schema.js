export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Nunjucks template string. Uses state/payload as context.' },
      {
        type: 'object',
        required: ['template'],
        properties: {
          template: {
            type: 'string',
            description: 'Nunjucks template string.',
          },
          on: {
            type: 'object',
            description: 'Object to use as template context.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
