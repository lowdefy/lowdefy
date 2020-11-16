const s3PresignedGetObjectSchema = {
  type: 'object',
  required: ['key'],
  properties: {
    expires: {
      type: 'number',
      description: 'Number of seconds for which the policy should be valid.',
      default: 3600,
    },
    key: {
      type: 'string',
      description: 'Key under which object is stored.',
    },
    versionId: {
      type: 'string',
      description: 'VersionId used to reference a specific version of the object.',
    },
    responseContentType: {
      type: 'string',
      description: 'Sets the Content-Type header of the response.',
    },
    responseContentDisposition: {
      type: 'string',
      description: 'Sets the Content-Disposition header of the response.',
    },
  },
};

export default s3PresignedGetObjectSchema;
