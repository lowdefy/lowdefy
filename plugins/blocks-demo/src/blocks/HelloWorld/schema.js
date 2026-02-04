export default {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: "Title text to display. Defaults to 'Hello, World!'.",
      },
      subtitle: {
        type: 'string',
        description: 'Subtitle text to display below the title.',
      },
      variant: {
        type: 'string',
        enum: ['default', 'outlined', 'filled'],
        default: 'default',
        description: 'Visual variant of the block.',
      },
      style: {
        type: 'object',
        description: 'Css style object to apply to the HelloWorld container.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Trigger actions when the HelloWorld block is clicked.',
      },
    },
  },
};
