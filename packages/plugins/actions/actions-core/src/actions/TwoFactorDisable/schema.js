export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the two-factor disable method.',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        description: 'The password of the signed-in user - disabling two-factor is password-gated.',
      },
    },
  },
};
