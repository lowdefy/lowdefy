export default {
  type: 'object',
  params: {
    type: 'object',
    required: ['docDefinition', 'filename'],
    properties: {
      docDefinition: {
        type: 'object',
        description: 'The pdfMake document definition object.',
      },
      tableLayouts: {
        type: 'object',
        description: 'Custom table layout definitions.',
      },
      filename: {
        type: 'string',
        description: 'The filename for the downloaded PDF.',
      },
      fonts: {
        type: 'object',
        description: 'Custom font definitions.',
      },
    },
    additionalProperties: false,
  },
};
