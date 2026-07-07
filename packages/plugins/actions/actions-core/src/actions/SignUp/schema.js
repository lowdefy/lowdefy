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
      captchaToken: {
        type: 'string',
        description:
          'Captcha token minted by a Captcha block, sent as the x-captcha-response header when auth.captcha is enabled. Tokens are single-use - reset the Captcha block in onError for retries.',
      },
    },
  },
};
