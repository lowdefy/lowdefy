export default {
  import: {
    block: 'blocks/CheckboxSelector/CheckboxSelector.js',
    styles: ['blocks/CheckboxSelector/style.less'],
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
