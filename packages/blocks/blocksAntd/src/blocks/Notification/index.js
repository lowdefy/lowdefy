export default {
  import: {
    block: 'blocks/Notification/Notification.js',
    styles: ['blocks/Notification/style.less'],
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
