export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the passkey to delete.',
    required: ['passkeyId'],
    properties: {
      passkeyId: {
        type: 'string',
        description: 'Id of the passkey to delete.',
      },
    },
  },
};
