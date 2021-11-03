export default {
  import: {
    block: 'blocks/TitleInput/TitleInput.js',
    styles: ['blocks/TitleInput/style.less'],
  },
  meta: {
    valueType: 'string',
    category: 'input',
    loading: {
      type: 'SkeletonParagraph',
      properties: {
        lines: 1,
      },
    },
  },
  test: {
    validation: true,
    required: true,
    values: ['Lorem ipsum dolor sit amet.'],
  },
};
