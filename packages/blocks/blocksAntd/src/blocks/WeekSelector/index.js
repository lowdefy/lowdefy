export default {
  import: {
    block: 'blocks/WeekSelector/WeekSelector.js',
    styles: ['blocks/WeekSelector/style.less'],
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
