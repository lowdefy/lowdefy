export default {
  import: {
    block: 'blocks/PageSiderMenu/PageSiderMenu.js',
    styles: ['blocks/PageSiderMenu/style.less'],
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
        name: 'toggleMobileMenuOpen',
        args: {},
      },
      {
        name: 'setMobileMenuOpen',
        args: {
          open: true,
        },
      },
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
