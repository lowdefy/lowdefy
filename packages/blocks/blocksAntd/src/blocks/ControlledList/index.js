export default {
  import: {
    block: 'blocks/ControlledList/ControlledList.js',
    styles: ['blocks/ControlledList/style.less'],
  },
  meta: {
    valueType: 'array',
    category: 'list',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 80,
      },
    },
  },
  test: {
    validation: true,
    required: true,
  },
};
