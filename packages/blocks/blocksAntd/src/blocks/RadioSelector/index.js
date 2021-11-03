export default {
  import: {
    block: 'blocks/RadioSelector/RadioSelector.js',
    styles: ['blocks/RadioSelector/style.less'],
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
