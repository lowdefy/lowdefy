export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the passkey register method.',
    properties: {
      name: {
        type: 'string',
        description: 'A display name for the passkey.',
      },
      authenticatorAttachment: {
        type: 'string',
        enum: ['platform', 'cross-platform'],
        description: 'Restrict the authenticator type used for registration.',
      },
    },
  },
};
