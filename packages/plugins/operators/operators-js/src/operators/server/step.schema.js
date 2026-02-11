export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in steps object.' },
      { type: 'integer', description: 'Index to access in steps object.' },
      { type: 'boolean', enum: [true], description: 'Return all steps data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in steps object.' },
              { type: 'integer', description: 'Index to access in steps object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all steps data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
