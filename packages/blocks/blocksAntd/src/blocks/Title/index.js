export default {
  import: {
    block: 'blocks/Title/Title.js',
    styles: ['blocks/Title/style.less'],
  },
  meta: {
    category: 'display',
    loading: {
      type: 'SkeletonParagraph',
      properties: {
        lines: 1,
      },
    },
  },
};
