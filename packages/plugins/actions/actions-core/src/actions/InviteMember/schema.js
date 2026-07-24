export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters for the invitation to the active organization.',
    required: ['email', 'role'],
    properties: {
      email: {
        type: 'string',
        description: 'Email address of the person to invite.',
      },
      role: {
        type: ['string', 'array'],
        items: {
          type: 'string',
        },
        description: 'Member role, or list of member roles, to assign when the invitation is accepted.',
      },
    },
  },
};
