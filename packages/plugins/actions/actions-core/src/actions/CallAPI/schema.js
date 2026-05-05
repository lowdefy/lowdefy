export default {
  type: 'object',
  params: {
    type: 'object',
    description: 'Parameters passed to the callAPI method.',
    properties: {
      endpointId: { type: 'string' },
      payload: { type: 'object' },
      holdValue: { type: 'boolean' },
    },
    required: ['endpointId'],
    additionalProperties: false,
  },
};
