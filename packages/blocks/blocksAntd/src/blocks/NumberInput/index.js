export default {
  import: {
    block: 'blocks/NumberInput/NumberInput.js',
    styles: ['blocks/NumberInput/style.less'],
  },
  meta: {
    valueType: 'number',
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
