export default {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning', 'loading'],
        description: 'The message status type.',
      },
      content: {
        type: 'string',
        description: 'The message content to display.',
      },
      duration: {
        type: 'number',
        description: 'Duration in seconds before the message disappears. Set to 0 for persistent.',
      },
    },
    additionalProperties: false,
  },
};
