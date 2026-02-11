export default {
  type: 'object',
  params: {
    type: 'array',
    minItems: 2,
    maxItems: 2,
    description: 'Array of [value, default]. Returns default if value is null or undefined.',
  },
};
