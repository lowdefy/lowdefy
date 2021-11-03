export default {
  import: {
    block: 'blocks/PageHSCF/PageHSCF.js',
    styles: ['blocks/PageHSCF/style.less'],
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
