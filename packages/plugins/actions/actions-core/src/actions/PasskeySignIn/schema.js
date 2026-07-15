export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the passkey sign-in method.',
    properties: {
      callbackUrl: {
        type: 'string',
        description: 'URL to navigate to after a successful passkey sign-in.',
      },
    },
  },
};
