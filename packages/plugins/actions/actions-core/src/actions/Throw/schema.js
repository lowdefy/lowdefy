export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['throw'],
    properties: {
      throw: {
        type: 'boolean',
        description: 'Whether to throw the error.',
      },
      message: {
        type: 'string',
        description: 'The error message to display.',
      },
      metaData: {
        description: 'Additional metadata to include with the error.',
      },
    },
    additionalProperties: false,
  },
};
