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
      email: {
        type: 'string',
        description: 'Email address for email and password or magic-link sign-in.',
      },
      password: {
        type: 'string',
        description: 'Password for email and password or phone and password sign-in.',
      },
      phoneNumber: {
        type: 'string',
        description:
          'Phone number for phone and password sign-in, in E.164 format (e.g. "+27831234567").',
      },
      magicLink: {
        type: 'boolean',
        description: 'Send a magic sign-in link to the email address instead of using a password.',
      },
      callbackUrl: {
        type: 'string',
        description: 'URL to redirect to after login.',
      },
      captchaToken: {
        type: 'string',
        description:
          'Captcha token minted by a Captcha block, sent as the x-captcha-response header when auth.captcha is enabled. Tokens are single-use - reset the Captcha block in onError for retries.',
      },
    },
  },
};
