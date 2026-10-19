export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Shorthand for a single blockId.',
      },
      {
        type: 'array',
        items: { type: 'string' },
        description: 'An array of blockIds to reset validation for.',
      },
      {
        type: 'boolean',
        description: 'true matches every block on the page.',
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          blockIds: {
            description: 'A blockId, a list of blockIds, or true for every block.',
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
              { type: 'boolean' },
            ],
          },
          regex: {
            description: 'A regular expression, or a list of them, matched against block ids.',
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
          },
        },
        description: 'Blocks to match by id and by regular expression.',
      },
    ],
  },
};
