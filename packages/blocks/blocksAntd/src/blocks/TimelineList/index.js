export default {
  import: {
    block: 'blocks/TimelineList/TimelineList.js',
    styles: ['blocks/TimelineList/style.less'],
  },
  meta: {
    category: 'list',
    loading: {
      type: 'Skeleton',
      properties: {
        height: 80,
      },
    },
  },
};
