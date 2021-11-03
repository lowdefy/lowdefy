export default {
  import: {
    block: 'blocks/S3UploadButton/S3UploadButton.js',
    styles: ['blocks/S3UploadButton/style.less'],
  },
  meta: {
    valueType: 'object',
    category: 'input',
    loading: {
      type: 'SkeletonButton',
    },
  },
};
