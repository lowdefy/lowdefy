export default {
  type: 'object',
  params: {
    oneOf: [
      { type: 'string', description: 'Menu ID to look up.' },
      { type: 'number', description: 'Menu index to access.' },
      { type: 'boolean', enum: [true], description: 'Return all menus.' },
      {
        type: 'object',
        properties: {
          value: {
            type: 'string',
            description: 'Menu ID to look up.',
          },
          index: {
            type: 'number',
            description: 'Menu index to access.',
          },
          all: {
            type: 'boolean',
            description: 'Return all menus.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
