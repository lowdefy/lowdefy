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
    },
  },
};
