export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the two-factor generate-backup-codes method.',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        description:
          'The password of the signed-in user - generating backup codes is password-gated.',
      },
    },
  },
};
