export default {
  import: {
    block: 'blocks/GithubColorSelector/GithubColorSelector.js',
    styles: ['blocks/GithubColorSelector/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'Skeleton',
      properties: {
        width: 216,
        height: 62,
      },
    },
  },
};
