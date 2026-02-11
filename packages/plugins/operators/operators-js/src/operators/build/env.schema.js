export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to environment variable.' },
      { type: 'integer', description: 'Index to access in env object.' },
      { type: 'boolean', enum: [true], description: 'Return all environment variables.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to environment variable.' },
              { type: 'integer', description: 'Index to access in env object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all environment variables.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
