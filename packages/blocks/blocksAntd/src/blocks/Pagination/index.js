export default {
  import: {
    block: 'blocks/Pagination/Pagination.js',
    styles: ['blocks/Pagination/style.less'],
  },
  meta: {
    valueType: 'object',
    initValue: {
      current: 0,
      pageSize: 10,
      skip: 0,
    },
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 33,
      },
    },
  },
};
