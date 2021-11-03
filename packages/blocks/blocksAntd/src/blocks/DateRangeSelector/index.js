export default {
  import: {
    block: 'blocks/DateRangeSelector/DateRangeSelector.js',
    styles: ['blocks/DateRangeSelector/style.less'],
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
