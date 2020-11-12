const s3PresignedPostPolicySchema = {
  type: 'object',
  required: ['key'],
  properties: {
    acl: {
      type: 'string',
      enum: [
        'private',
        'public-read',
        'public-read-write',
        'aws-exec-read',
        'authenticated-read',
        'bucket-owner-read',
        'bucket-owner-full-control',
      ],
      description: 'Access control lists used to grant read and write access.',
    },
    conditions: {
      type: 'array',
      items: {
        type: 'array',
      },
      description: 'Conditions to be enforced on the request.',
    },
    expires: {
      type: 'number',
      description: 'Number of seconds for which the policy should be valid.',
      default: 3600,
    },
    key: {
      type: 'string',
      description: 'Key under which object will be stored.',
    },
  },
};

export default s3PresignedPostPolicySchema;
