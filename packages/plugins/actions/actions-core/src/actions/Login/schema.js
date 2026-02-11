export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the login method.',
    properties: {
      providerId: {
        type: 'string',
        description: 'The authentication provider ID.',
      },
      callbackUrl: {
        type: 'string',
        description: 'URL to redirect to after login.',
      },
    },
  },
};
