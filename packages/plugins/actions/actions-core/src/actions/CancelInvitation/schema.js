export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the invitation to cancel.',
    required: ['invitationId'],
    properties: {
      invitationId: {
        type: 'string',
        description: 'Id of the pending invitation to cancel.',
      },
    },
  },
};
