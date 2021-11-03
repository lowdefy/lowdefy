export default {
  import: {
    block: 'blocks/Sider/Sider.js',
    styles: ['blocks/Sider/style.less'],
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
