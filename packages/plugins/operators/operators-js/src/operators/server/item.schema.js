export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in items object.' },
      { type: 'integer', description: 'Index to access in items object.' },
      { type: 'boolean', enum: [true], description: 'Return all items data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in items object.' },
              { type: 'integer', description: 'Index to access in items object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all items data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
