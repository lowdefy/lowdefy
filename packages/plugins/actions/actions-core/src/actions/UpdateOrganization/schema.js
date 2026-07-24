export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters to update on the active organization.',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        description: 'New display name for the active organization.',
      },
    },
  },
};
