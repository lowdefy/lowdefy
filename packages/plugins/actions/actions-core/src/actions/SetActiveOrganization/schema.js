export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Parameters identifying the organization to set active. One of organizationId or organizationSlug is required.',
    properties: {
      organizationId: {
        type: 'string',
        description: 'Id of the organization to set as the active organization.',
      },
      organizationSlug: {
        type: 'string',
        description: 'Slug of the organization to set as the active organization.',
      },
    },
  },
};
