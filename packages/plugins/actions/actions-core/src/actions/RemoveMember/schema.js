export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the member to remove from the active organization.',
    required: ['memberIdOrEmail'],
    properties: {
      memberIdOrEmail: {
        type: 'string',
        description: 'Member id or email address of the member to remove.',
      },
    },
  },
};
