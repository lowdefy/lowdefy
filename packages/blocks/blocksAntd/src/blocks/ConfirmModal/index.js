export default {
  import: {
    block: 'blocks/ConfirmModal/ConfirmModal.js',
    styles: ['blocks/ConfirmModal/style.less'],
  },
  meta: {
    category: 'container',
    loading: false,
  },
  test: {
    methods: [
      {
        name: 'open',
        args: {},
      },
      {
        name: 'open',
        args: {
          status: 'warning',
        },
      },
      {
        name: 'open',
        args: {
          message: 'Args message',
        },
      },
      {
        name: 'open',
        args: {
          description: 'Args description',
        },
      },
      {
        name: 'open',
        args: {
          duration: 1,
        },
      },
    ],
  },
};
