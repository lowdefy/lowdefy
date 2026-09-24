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
        type: 'object',
        description:
          'Structured callback target for where the new account lands - both where the emailed verification link goes and, when the response carries a session, where the browser navigates. basePath-prefixed. Defaults to the home page when omitted and no ?callbackUrl= query is present. A false value is not valid here: the same value is the emailed link destination, which SignUp cannot suppress.',
        properties: {
          home: {
            type: 'boolean',
            description: "Land on the app's home page.",
          },
          pageId: {
            type: 'string',
            description: 'The pageId to land on.',
          },
          url: {
            type: 'string',
            description:
              'The URL to land on. An absolute URL is not basePath-prefixed, so it can be an external landing page.',
          },
          urlQuery: {
            type: 'object',
            description: 'The urlQuery to set on the destination.',
          },
        },
      },
      captchaToken: {
        type: 'string',
        description:
          'Captcha token minted by a Captcha block, sent as the x-captcha-response header when auth.captcha is enabled. Tokens are single-use - reset the Captcha block in onError for retries.',
      },
    },
  },
};
