export default {
  import: {
    block: 'blocks/Drawer/Drawer.js',
    styles: ['blocks/Drawer/style.less'],
  },
  meta: {
    category: 'container',
    loading: false,
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
