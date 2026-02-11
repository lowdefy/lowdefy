export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        enum: [
          'string',
          'array',
          'date',
          'object',
          'boolean',
          'number',
          'integer',
          'null',
          'undefined',
          'none',
          'primitive',
        ],
        description: 'Type name to test against state value at current location.',
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: [
              'string',
              'array',
              'date',
              'object',
              'boolean',
              'number',
              'integer',
              'null',
              'undefined',
              'none',
              'primitive',
            ],
            description: 'Type name to test.',
          },
          on: {
            description: 'Value to test the type of.',
          },
          key: {
            type: 'string',
            description: 'State key to test the type of.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
