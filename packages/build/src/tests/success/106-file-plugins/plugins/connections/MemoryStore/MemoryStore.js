// A file-plugin connection is the connection object a package connection
// exports, minus the barrel: the build assembles the requests map from the
// files under requests/. This one declares its schema as a static; a request
// declares its schema and its gates in a sibling JSON.
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['rows'],
  properties: {
    rows: {
      type: 'array',
      description: 'The rows the connection serves.',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
  },
};

export default { schema };
