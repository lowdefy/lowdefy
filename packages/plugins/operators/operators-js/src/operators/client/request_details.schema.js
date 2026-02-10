export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in request details.' },
      { type: 'integer', description: 'Index to access in request details.' },
      { type: 'boolean', enum: [true], description: 'Return all request details.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in request details.' },
              { type: 'integer', description: 'Index to access in request details.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all request details.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
