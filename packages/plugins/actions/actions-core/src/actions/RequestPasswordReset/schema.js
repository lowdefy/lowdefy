export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the request-password-reset method.',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the account to send the password reset email to.',
      },
      redirectTo: {
        type: 'string',
        description:
          'URL of the app page where the user resets their password - the emailed link redirects here with the reset token as a query parameter.',
      },
    },
  },
};
