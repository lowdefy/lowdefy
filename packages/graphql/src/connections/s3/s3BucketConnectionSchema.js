const s3BucketConnectionSchema = {
  type: 'object',
  required: ['accessKeyId', 'secretAccessKey', 'region', 'bucket'],
  properties: {
    accessKeyId: {
      type: 'string',
      description: 'AWS IAM access key id with s3 access.',
    },
    secretAccessKey: {
      type: 'string',
      description: 'AWS IAM secret access key with s3 access.',
    },
    region: {
      type: 'string',
      description: 'AWS region the bucket is located in.',
    },
    bucket: {
      type: 'string',
      description: 'S3 bucket name.',
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the bucket.',
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the bucket.',
    },
  },
};

export default s3BucketConnectionSchema;
