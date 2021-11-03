export default {
  import: {
    block: 'blocks/DateTimeSelector/DateTimeSelector.js',
    styles: ['blocks/DateTimeSelector/style.less'],
  },
  meta: {
    valueType: 'date',
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
