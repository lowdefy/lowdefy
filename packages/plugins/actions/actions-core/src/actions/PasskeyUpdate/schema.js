export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the passkey to rename and its new name.',
    required: ['passkeyId', 'name'],
    properties: {
      passkeyId: {
        type: 'string',
        description: 'Id of the passkey to rename.',
      },
      name: {
        type: 'string',
        description: 'New name for the passkey.',
      },
    },
  },
};
