export default {
  import: {
    block: 'blocks/PageHCSF/PageHCSF.js',
    styles: ['blocks/PageHCSF/style.less'],
  },
  meta: {
    category: 'container',
    loading: {
      type: 'Spinner',
      properties: {
        height: '100vh',
      },
    },
  },
  test: {
    methods: [
      {
        name: 'toggleSiderOpen',
        args: {},
      },
      {
        name: 'setSiderOpen',
        args: {
          open: true,
        },
      },
    ],
  },
};
