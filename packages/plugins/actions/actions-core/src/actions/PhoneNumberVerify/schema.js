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
    },
  },
};
