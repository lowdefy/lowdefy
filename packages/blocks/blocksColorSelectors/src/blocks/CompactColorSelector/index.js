export default {
  import: {
    block: 'blocks/CompactColorSelector/CompactColorSelector.js',
    styles: ['blocks/CompactColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        width: 245,
        height: 90,
      },
    },
  },
};
