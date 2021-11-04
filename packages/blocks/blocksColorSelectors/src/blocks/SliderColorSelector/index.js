export default {
  import: {
    block: 'blocks/SliderColorSelector/SliderColorSelector.js',
    styles: ['blocks/SliderColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 44,
      },
    },
  },
};
