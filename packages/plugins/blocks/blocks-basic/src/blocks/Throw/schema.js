export default {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      message: {
        type: 'string',
        description: 'Error message to throw.',
        default: 'Intentional error thrown by Throw block',
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
};
