export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Parameters passed to the request-password-reset method. One of email or phoneNumber is required.',
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the account to send the password reset email to.',
      },
      phoneNumber: {
        type: 'string',
        description:
          'Phone number of the account to send the password reset otp to over SMS, in E.164 format.',
      },
      redirectTo: {
        type: 'string',
        description:
          'URL of the app page where the user resets their password - the emailed link redirects here with the reset token as a query parameter.',
      },
      captchaToken: {
        type: 'string',
        description:
          'Captcha token minted by a Captcha block, sent as the x-captcha-response header when auth.captcha is enabled. Tokens are single-use - reset the Captcha block in onError for retries.',
      },
    },
  },
};
