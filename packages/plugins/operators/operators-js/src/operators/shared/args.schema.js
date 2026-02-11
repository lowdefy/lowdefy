export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in args.' },
      { type: 'integer', description: 'Index to access in args.' },
      { type: 'boolean', enum: [true], description: 'Return all args.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in args.' },
              { type: 'integer', description: 'Index to access in args.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all args.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
