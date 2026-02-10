export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in state.' },
      { type: 'integer', description: 'Index to access in state.' },
      { type: 'boolean', enum: [true], description: 'Return all state.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in state.' },
              { type: 'integer', description: 'Index to access in state.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all state.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
