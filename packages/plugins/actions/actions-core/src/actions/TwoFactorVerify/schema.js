export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Parameters passed to the two-factor verify method. One of code or backupCode is required.',
    properties: {
      code: {
        type: 'string',
        description: 'The TOTP code from the authenticator app.',
      },
      backupCode: {
        type: 'string',
        description: 'A backup code, used instead of a TOTP code.',
      },
      trustDevice: {
        type: 'boolean',
        description: 'Trust this device for 30 days - no two-factor challenge on sign-in.',
      },
      callbackUrl: {
        oneOf: [
          {
            type: 'object',
            description:
              "Structured callback target for where a successful challenge lands, basePath-prefixed. Defaults to the app's home page when omitted and no ?callbackUrl= query is present; the ?callbackUrl= query the sign-in method put on the challenge page wins over that default, and this param wins over both.",
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
              'Do not navigate - for a challenge page that renders its own post-challenge state instead.',
          },
        ],
      },
    },
  },
};
