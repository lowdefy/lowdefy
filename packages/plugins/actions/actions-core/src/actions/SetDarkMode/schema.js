export default {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      darkMode: {
        type: 'boolean',
        description:
          'Set dark mode on or off. When not provided, toggles the current dark mode state.',
      },
    },
    additionalProperties: false,
  },
};
