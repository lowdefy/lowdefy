export default {
  import: {
    block: 'blocks/AutoComplete/AutoComplete.js',
    styles: ['blocks/AutoComplete/style.less'],
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
