export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in actions object.' },
      { type: 'integer', description: 'Index to access in actions object.' },
      { type: 'boolean', enum: [true], description: 'Return all actions data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in actions object.' },
              { type: 'integer', description: 'Index to access in actions object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all actions data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
