export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in URL query params.' },
      { type: 'integer', description: 'Index to access in URL query params.' },
      { type: 'boolean', enum: [true], description: 'Return all URL query params.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in URL query params.' },
              { type: 'integer', description: 'Index to access in URL query params.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all URL query params.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
