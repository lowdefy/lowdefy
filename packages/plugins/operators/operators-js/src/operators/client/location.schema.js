export default {
  type: 'object',
  params: {
    type: 'string',
    enum: [
      'basePath',
      'hash',
      'homePageId',
      'host',
      'hostname',
      'href',
      'origin',
      'pageId',
      'pathname',
      'port',
      'protocol',
      'search',
    ],
    description: 'Browser window location property to return.',
  },
};
