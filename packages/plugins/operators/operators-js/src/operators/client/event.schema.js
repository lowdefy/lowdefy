export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in event object.' },
      { type: 'integer', description: 'Index to access in event object.' },
      { type: 'boolean', enum: [true], description: 'Return all event data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in event object.' },
              { type: 'integer', description: 'Index to access in event object.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all event data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
