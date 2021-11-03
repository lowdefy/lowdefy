export default {
  import: {
    block: 'blocks/PageHeaderMenu/PageHeaderMenu.js',
    styles: ['blocks/PageHeaderMenu/style.less'],
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
        name: 'toggleOpen',
        args: {},
      },
      {
        name: 'setOpen',
        args: {
          open: true,
        },
      },
    ],
  },
};
