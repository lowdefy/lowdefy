export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['branches'],
    properties: {
      branches: {
        type: 'array',
        items: {
          type: 'object',
          required: ['if'],
          properties: {
            if: {
              type: 'boolean',
              description: 'Boolean condition for this branch.',
            },
            then: {
              description: 'Value returned when condition is true.',
            },
          },
          additionalProperties: false,
        },
        description: 'Array of conditional branches.',
      },
      default: {
        description: 'Value returned when no branch matches.',
      },
    },
    additionalProperties: false,
  },
};
