export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the reset-password method.',
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
    },
  },
};
