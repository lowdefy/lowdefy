export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the phone-number verify method.',
    required: ['phoneNumber', 'code'],
    properties: {
      phoneNumber: {
        type: 'string',
        description: 'Phone number the OTP was sent to, in E.164 format.',
      },
      code: {
        type: 'string',
        description: 'The OTP code received over SMS.',
      },
      disableSession: {
        type: 'boolean',
        description: 'Verify without creating a session.',
      },
      updatePhoneNumber: {
        type: 'boolean',
        description:
          'Update the signed-in user to this phone number on verify - the phone change confirmation flow.',
      },
      callbackUrl: {
        oneOf: [
          {
            type: 'object',
            description:
              "Structured callback target for where a successful verification lands, basePath-prefixed. Defaults to the app's home page when omitted and no ?callbackUrl= query is present; a ?callbackUrl= query set by the unauthenticated-page redirect wins over that default, and this param wins over both. Ignored when the verification creates no session: with disableSession: true, and with updatePhoneNumber: true, where a signed-in user is confirming a new number and stays where they are.",
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
              'Do not navigate - the session store re-renders the page with the new user in place, for a verify form in a modal or an embedded panel.',
          },
        ],
      },
    },
  },
};
