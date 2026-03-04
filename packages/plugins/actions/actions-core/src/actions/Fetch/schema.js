export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['url'],
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch.',
      },
      options: {
        type: 'object',
        description: 'Fetch API options (method, headers, body, etc.).',
      },
      responseFunction: {
        type: 'string',
        enum: ['json', 'text', 'blob', 'arrayBuffer', 'formData'],
        description: 'Response method to call on the fetch response.',
      },
    },
    additionalProperties: false,
  },
};
