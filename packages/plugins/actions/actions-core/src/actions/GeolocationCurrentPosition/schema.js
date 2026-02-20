export default {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      enableHighAccuracy: {
        type: 'boolean',
        description: 'Whether to use high accuracy mode.',
      },
      timeout: {
        type: 'number',
        description: 'Maximum time in milliseconds to wait for a position.',
      },
      maximumAge: {
        type: 'number',
        description: 'Maximum age in milliseconds of a cached position.',
      },
    },
    additionalProperties: false,
  },
};
