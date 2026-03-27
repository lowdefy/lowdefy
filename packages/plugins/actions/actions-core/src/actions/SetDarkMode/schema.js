export default {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      darkMode: {
        type: 'string',
        enum: ['system', 'light', 'dark'],
        description:
          'Set dark mode preference. When not provided, cycles through light, dark, and system.',
      },
    },
    additionalProperties: false,
  },
};
