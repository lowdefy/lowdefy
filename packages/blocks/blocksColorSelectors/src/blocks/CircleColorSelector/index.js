export default {
  import: {
    block: 'blocks/CircleColorSelector/CircleColorSelector.js',
    styles: ['blocks/CircleColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 42,
      },
    },
  },
};
