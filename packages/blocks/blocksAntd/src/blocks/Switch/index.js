export default {
  import: {
    block: 'blocks/Switch/Switch.js',
    styles: ['blocks/Switch/style.less'],
  },
  meta: {
    valueType: 'boolean',
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
