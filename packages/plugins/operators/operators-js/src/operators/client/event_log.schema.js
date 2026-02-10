export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Dot-notation path to value in event log.' },
      { type: 'integer', description: 'Index to access in event log.' },
      { type: 'boolean', enum: [true], description: 'Return all event log data.' },
      {
        type: 'object',
        properties: {
          key: {
            oneOf: [
              { type: 'string', description: 'Dot-notation path to value in event log.' },
              { type: 'integer', description: 'Index to access in event log.' },
            ],
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all event log data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
