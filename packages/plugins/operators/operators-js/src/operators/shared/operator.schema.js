export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        description: 'Name of the operator to call (e.g. "_sum", "_string.concat").',
      },
      params: {
        description: 'Params to pass to the operator.',
      },
    },
    additionalProperties: false,
  },
};
