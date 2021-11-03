export default {
  import: {
    block: 'blocks/Selector/Selector.js',
    styles: ['blocks/Selector/style.less'],
  },
  meta: {
    valueType: 'any',
    category: 'input',
    loading: {
      type: 'SkeletonInput',
    },
  },
  test: {
    validation: true,
    required: true,
  },
};
