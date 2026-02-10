export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        enum: ['string', 'integer', 'float'],
        description: 'Type of random value to generate.',
      },
      {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['string', 'integer', 'float'],
            description: 'Type of random value to generate.',
          },
          length: {
            type: 'number',
            description: 'Length of random string (default 8). Only for type "string".',
          },
          min: {
            type: 'number',
            description: 'Minimum value (inclusive). Only for type "integer" or "float".',
          },
          max: {
            type: 'number',
            description: 'Maximum value (inclusive). Only for type "integer" or "float".',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
