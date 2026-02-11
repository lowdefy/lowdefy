export default {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      blockId: {
        type: 'string',
        description: 'The blockId of the element to scroll to.',
      },
      options: {
        type: 'object',
        description: 'ScrollIntoView options when blockId is provided.',
        properties: {
          behavior: {
            type: 'string',
            enum: ['auto', 'smooth'],
            description: 'Scroll behavior.',
          },
          block: {
            type: 'string',
            enum: ['start', 'center', 'end', 'nearest'],
            description: 'Vertical alignment.',
          },
          inline: {
            type: 'string',
            enum: ['start', 'center', 'end', 'nearest'],
            description: 'Horizontal alignment.',
          },
        },
        additionalProperties: false,
      },
      top: {
        type: 'number',
        description: 'Vertical scroll position when no blockId is provided.',
      },
      left: {
        type: 'number',
        description: 'Horizontal scroll position when no blockId is provided.',
      },
      behavior: {
        type: 'string',
        enum: ['auto', 'smooth'],
        description: 'Scroll behavior when no blockId is provided.',
      },
    },
    additionalProperties: false,
  },
};
