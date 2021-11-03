export default {
  import: {
    block: 'blocks/Modal/Modal.js',
    styles: ['blocks/Modal/style.less'],
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
