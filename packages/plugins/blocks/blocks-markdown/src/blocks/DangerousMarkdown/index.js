export default {
  import: {
    block: 'blocks/DangerousMarkdown/DangerousMarkdown.js',
    styles: [],
  },
  meta: {
    category: 'container',
    loading: {
      type: 'SkeletonParagraph',
      properties: {
        lines: 7,
      },
    },
  },
};
