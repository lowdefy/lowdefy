export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in input object.' },
      { type: 'integer', description: 'Index to access in input object.' },
      { type: 'boolean', enum: [true], description: 'Return all input data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in input object.' },
              { type: 'integer', description: 'Index to access in input object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all input data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
