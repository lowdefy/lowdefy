export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Parameters passed to the reset-password method. Resets with the emailed token, or with the SMS otp when phoneNumber is set.',
    required: ['newPassword'],
    properties: {
      newPassword: {
        type: 'string',
        description: 'The new password to set.',
      },
      token: {
        type: 'string',
        description: 'The reset token from the emailed password reset link.',
      },
      phoneNumber: {
        type: 'string',
        description: 'Phone number the reset otp was sent to, in E.164 format.',
      },
      otp: {
        type: 'string',
        description: 'The reset code received over SMS, used with phoneNumber instead of token.',
      },
    },
  },
};
