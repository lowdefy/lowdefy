export default {
  import: {
    block: 'blocks/PasswordInput/PasswordInput.js',
    styles: ['blocks/PasswordInput/style.less'],
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
