export default {
  import: {
    block: 'blocks/SwatchesColorSelector/SwatchesColorSelector.js',
    styles: ['blocks/SwatchesColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 175,
      },
    },
  },
};
