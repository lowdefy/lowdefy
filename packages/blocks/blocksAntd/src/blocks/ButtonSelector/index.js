export default {
  import: {
    block: 'blocks/ButtonSelector/ButtonSelector.js',
    styles: ['blocks/ButtonSelector/style.less'],
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
