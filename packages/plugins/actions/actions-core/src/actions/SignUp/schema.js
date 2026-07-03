export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the sign-up method (email/password only).',
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the account to create.',
      },
      password: {
        type: 'string',
        description: 'Password for the new account.',
      },
      name: {
        type: 'string',
        description: 'Name of the user.',
      },
      callbackUrl: {
        type: 'string',
        description: 'URL to redirect to after email verification.',
      },
    },
  },
};
