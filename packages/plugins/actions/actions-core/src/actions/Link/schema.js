export default {
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description: 'Shorthand for pageId.',
      },
      {
        type: 'object',
        description: 'Link parameters.',
        properties: {
          pageId: {
            type: 'string',
            description: 'The pageId to link to.',
          },
          url: {
            type: 'string',
            description: 'An external URL to link to.',
          },
          newWindow: {
            type: 'boolean',
            description: 'Open the link in a new window.',
          },
          urlQuery: {
            type: 'object',
            description: 'URL query parameters.',
          },
          input: {
            type: 'object',
            description: 'Input to pass to the linked page.',
          },
        },
      },
    ],
  },
};
