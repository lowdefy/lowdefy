export default {
  import: {
    block: 'blocks/MonthSelector/MonthSelector.js',
    styles: ['blocks/MonthSelector/style.less'],
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
