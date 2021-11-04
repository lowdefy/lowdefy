export default {
  import: {
    block: 'blocks/TwitterColorSelector/TwitterColorSelector.js',
    styles: ['blocks/TwitterColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 96,
      },
    },
  },
};
