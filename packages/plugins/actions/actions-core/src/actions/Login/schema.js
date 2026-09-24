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
        oneOf: [
          {
            type: 'object',
            description:
              "Structured callback target for where a successful sign-in lands, basePath-prefixed. Defaults to the app's home page when omitted and no ?callbackUrl= query is present; a ?callbackUrl= query set by the unauthenticated-page redirect wins over that default, and this param wins over both.",
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
          {
            enum: [false],
            description:
              'Do not navigate - the session store re-renders the page with the new user in place, for a login form in a modal or an embedded panel. Not valid for magic-link or social/OAuth sign-in, which redirect through an external hop.',
          },
        ],
      },
      newUserCallbackUrl: {
        type: 'object',
        description:
          'Structured callback target for where a first-time user lands after a magic link (or social/OAuth sign-in) creates their account. Resolved like callbackUrl - basePath-prefixed. When omitted, BetterAuth defaults it to callbackUrl. Ignored by email and phone sign-in.',
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
      errorCallbackUrl: {
        type: 'object',
        description:
          "Structured callback target for where a failed or expired magic link (or social/OAuth sign-in) lands, carrying the ?error= reason. Resolved like callbackUrl - basePath-prefixed. When omitted, defaults to the app's authPages.error page (basePath-prefixed); if authPages.error is unset, BetterAuth's own fallback stands. Ignored by email and phone sign-in.",
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
