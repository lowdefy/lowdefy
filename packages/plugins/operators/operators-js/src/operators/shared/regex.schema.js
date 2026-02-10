export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Regex pattern string to test against the current location value.' },
      {
        type: 'object',
        required: ['pattern'],
        properties: {
          pattern: {
            type: 'string',
            description: 'Regex pattern string.',
          },
          on: {
            type: 'string',
            description: 'String to test the pattern against.',
          },
          key: {
            type: 'string',
            description: 'State key path to get the string to test against.',
          },
          flags: {
            type: 'string',
            description: 'Regex flags (default "gm").',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
