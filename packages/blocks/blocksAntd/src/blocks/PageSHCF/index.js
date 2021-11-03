export default {
  import: {
    block: 'blocks/PageSHCF/PageSHCF.js',
    styles: ['blocks/PageSHCF/style.less'],
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
