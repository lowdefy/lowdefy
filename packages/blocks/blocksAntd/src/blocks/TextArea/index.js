export default {
  import: {
    block: 'blocks/TextArea/TextArea.js',
    styles: ['blocks/TextArea/style.less'],
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
