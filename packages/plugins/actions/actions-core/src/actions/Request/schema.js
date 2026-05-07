export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Shorthand for a single requestId.',
      },
      {
        type: 'array',
        items: { type: 'string' },
        description: 'An array of requestIds to call.',
      },
      {
        type: 'object',
        description: 'Request parameters.',
        oneOf: [
          {
            type: 'object',
            properties: {
              all: { const: true },
              holdValue: { type: 'boolean' },
            },
            required: ['all'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              requestId: { type: 'string' },
              holdValue: { type: 'boolean' },
            },
            required: ['requestId'],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              requestIds: { type: 'array', items: { type: 'string' } },
              holdValue: { type: 'boolean' },
            },
            required: ['requestIds'],
            additionalProperties: false,
          },
        ],
      },
    ],
  },
};
