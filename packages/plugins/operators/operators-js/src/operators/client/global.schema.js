export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in global object.' },
      { type: 'integer', description: 'Index to access in global object.' },
      { type: 'boolean', enum: [true], description: 'Return all global data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in global object.' },
              { type: 'integer', description: 'Index to access in global object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all global data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
