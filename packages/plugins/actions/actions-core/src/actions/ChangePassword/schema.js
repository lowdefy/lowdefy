export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the change-password method.',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        description: 'The current password of the signed-in user.',
      },
      newPassword: {
        type: 'string',
        description: 'The new password to set.',
      },
      revokeOtherSessions: {
        type: 'boolean',
        description: 'Revoke all other sessions after the password change.',
      },
    },
  },
};
