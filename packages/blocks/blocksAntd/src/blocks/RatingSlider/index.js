export default {
  import: {
    block: 'blocks/RatingSlider/RatingSlider.js',
    styles: ['blocks/RatingSlider/style.less'],
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
