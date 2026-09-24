export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the invitation to accept.',
    required: ['invitationId'],
    properties: {
      invitationId: {
        type: 'string',
        description: 'Id of the invitation to accept.',
      },
    },
  },
};
