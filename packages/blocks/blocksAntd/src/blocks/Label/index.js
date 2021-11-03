export default {
  import: {
    block: 'blocks/Label/Label.js',
    styles: ['blocks/Label/style.less'],
  },
  meta: {
    category: 'container',
    loading: {
      type: 'SkeletonInput',
    },
  },
  test: {
    validation: true,
    required: true,
  },
};
