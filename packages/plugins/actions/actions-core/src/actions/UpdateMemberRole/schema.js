export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters identifying the member and the role to assign.',
    required: ['memberId', 'role'],
    properties: {
      memberId: {
        type: 'string',
        description: 'Id of the member whose role to update.',
      },
      role: {
        type: ['string', 'array'],
        items: {
          type: 'string',
        },
        description: 'Member role, or list of member roles, to assign.',
      },
    },
  },
};
