export default {
  import: {
    block: 'blocks/CheckboxSwitch/CheckboxSwitch.js',
    styles: ['blocks/CheckboxSwitch/style.less'],
  },
  meta: {
    valueType: 'boolean',
    category: 'input',
    loading: {
      type: 'SkeletonInput',
    },
  },
  test: {
    validation: true,
    required: true,
    values: [true],
  },
};
