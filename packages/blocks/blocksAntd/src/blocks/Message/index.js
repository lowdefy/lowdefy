export default {
  import: {
    block: 'blocks/Message/Message.js',
    styles: ['blocks/Message/style.less'],
  },
  meta: {
    category: 'display',
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
          content: 'Args message content',
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
