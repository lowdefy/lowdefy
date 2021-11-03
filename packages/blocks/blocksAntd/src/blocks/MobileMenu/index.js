export default {
  import: {
    block: 'blocks/MobileMenu/MobileMenu.js',
    styles: ['blocks/MobileMenu/style.less'],
  },
  meta: {
    category: 'display',
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
