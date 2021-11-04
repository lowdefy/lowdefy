export default {
  import: {
    block: 'blocks/ChromeColorSelector/ChromeColorSelector.js',
    styles: ['blocks/ChromeColorSelector/style.less'],
  },
  meta: {
    valueType: 'object',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        width: 225,
        height: 240,
      },
    },
  },
};
