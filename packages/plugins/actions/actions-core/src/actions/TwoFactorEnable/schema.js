export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the two-factor enable method.',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        description: 'The password of the signed-in user - enabling two-factor is password-gated.',
      },
    },
  },
};
