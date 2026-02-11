export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in secrets object.' },
      { type: 'integer', description: 'Index to access in secrets object.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in secrets object.' },
              { type: 'integer', description: 'Index to access in secrets object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
