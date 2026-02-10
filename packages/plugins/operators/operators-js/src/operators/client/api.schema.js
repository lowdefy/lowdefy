export default {
  type: 'object',
  params: {
    type: 'string',
    description:
      'Dot-notation path to API response data. First segment is the endpoint name, remaining segments access nested properties.',
  },
};
