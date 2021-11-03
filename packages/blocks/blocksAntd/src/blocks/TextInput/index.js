export default {
  import: {
    block: 'blocks/TextInput/TextInput.js',
    styles: ['blocks/TextInput/style.less'],
  },
  meta: {
    valueType: 'string',
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
