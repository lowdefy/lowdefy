export default {
  type: 'object',
  params: {
    type: 'string',
    description:
      'Dot-notation path to request response data. First segment is the request ID, remaining segments access nested properties.',
  },
};
