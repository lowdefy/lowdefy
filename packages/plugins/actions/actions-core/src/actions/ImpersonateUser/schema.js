export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the user to impersonate.',
    required: ['userId'],
    properties: {
      userId: {
        type: 'string',
        description: 'Id of the user to impersonate.',
      },
    },
  },
};
