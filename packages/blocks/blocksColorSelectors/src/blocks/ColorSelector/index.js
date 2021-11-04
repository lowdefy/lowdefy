export default {
  import: {
    block: 'blocks/ColorSelector/ColorSelector.js',
    styles: ['blocks/ColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 216,
      },
    },
  },
};
