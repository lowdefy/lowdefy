export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the logout method.',
    properties: {
      callbackUrl: {
        type: 'object',
        description:
          'Structured callback target for where a signed-out user lands, basePath-prefixed. Unlike the sign-in actions this has no default and does not read the ?callbackUrl= query: with no target the session provider reloads the page and the server re-applies the page auth fork, which sends a protected page to the sign-in page.',
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
              'The URL to land on. An absolute URL is not basePath-prefixed, so it can be an external logout landing page.',
          },
          urlQuery: {
            type: 'object',
            description: 'The urlQuery to set on the destination.',
          },
        },
      },
    },
  },
};
