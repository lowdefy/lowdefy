export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the passkey sign-in method.',
    properties: {
      callbackUrl: {
        oneOf: [
          {
            type: 'object',
            description:
              "Structured callback target for where a successful passkey sign-in lands, basePath-prefixed. Defaults to the app's home page when omitted and no ?callbackUrl= query is present; a ?callbackUrl= query set by the unauthenticated-page redirect wins over that default, and this param wins over both.",
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
              'Do not navigate - the session store re-renders the page with the new user in place, for a re-authentication prompt in a modal or an embedded panel.',
          },
        ],
      },
    },
  },
};
