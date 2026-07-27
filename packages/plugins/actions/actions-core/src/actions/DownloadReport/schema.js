export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Download a rendered report of a page. Defaults to the current page in pdf format, rendered from the live urlQuery, input and state.',
    properties: {
      pageId: {
        type: 'string',
        description: 'The page to render. Defaults to the current page.',
      },
      format: {
        type: 'string',
        enum: ['pdf', 'xlsx'],
        description: 'The report format. Defaults to pdf.',
      },
      filename: {
        type: 'string',
        description: 'The download filename. Defaults to "{pageId}.{format}".',
      },
      urlQuery: {
        type: 'object',
        description:
          'Url query the report renders with. Defaults to the current page url query when rendering the current page.',
      },
      input: {
        type: 'object',
        description:
          'Input the report renders with. Defaults to the current page input when rendering the current page.',
      },
      state: {
        type: 'object',
        description:
          'State the report renders with. Defaults to the current page state when rendering the current page.',
      },
    },
    additionalProperties: false,
  },
};
