export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in payload object.' },
      { type: 'integer', description: 'Index to access in payload object.' },
      { type: 'boolean', enum: [true], description: 'Return all payload data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in payload object.' },
              { type: 'integer', description: 'Index to access in payload object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all payload data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
