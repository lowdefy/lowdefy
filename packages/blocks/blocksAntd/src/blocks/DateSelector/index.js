export default {
  import: {
    block: 'blocks/DateSelector/DateSelector.js',
    styles: ['blocks/DateSelector/style.less'],
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
