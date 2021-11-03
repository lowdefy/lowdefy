export default {
  import: {
    block: 'blocks/MultipleSelector/MultipleSelector.js',
    styles: ['blocks/MultipleSelector/style.less'],
  },
  meta: {
    valueType: 'array',
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
