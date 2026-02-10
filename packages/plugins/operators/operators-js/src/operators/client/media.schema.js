export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        enum: ['size', 'width', 'height'],
        description: 'Media property to return.',
      },
      { type: 'boolean', enum: [true], description: 'Return all media data.' },
      {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            enum: ['size', 'width', 'height'],
            description: 'Media property to return.',
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all media data.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
