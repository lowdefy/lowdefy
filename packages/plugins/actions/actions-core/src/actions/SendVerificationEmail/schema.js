export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the send-verification-email method.',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the unverified account to send the verification email to.',
      },
      callbackUrl: {
        type: 'string',
        description: 'URL to redirect to after email verification.',
      },
    },
  },
};
