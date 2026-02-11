export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in user object.' },
      { type: 'integer', description: 'Index to access in user object.' },
      { type: 'boolean', enum: [true], description: 'Return all user data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in user object.' },
              { type: 'integer', description: 'Index to access in user object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all user data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
