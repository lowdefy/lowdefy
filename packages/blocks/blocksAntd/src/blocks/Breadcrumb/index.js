export default {
  import: {
    block: 'blocks/Breadcrumb/Breadcrumb.js',
    styles: ['blocks/Breadcrumb/style.less'],
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
