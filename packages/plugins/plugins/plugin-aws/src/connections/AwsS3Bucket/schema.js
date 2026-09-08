/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - AwsS3Bucket',
  type: 'object',
  required: ['accessKeyId', 'secretAccessKey', 'region', 'bucket'],
  properties: {
    accessKeyId: {
      type: 'string',
      description: 'AWS IAM access key id with s3 access.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "accessKeyId" should be a string.',
      },
    },
    secretAccessKey: {
      type: 'string',
      description: 'AWS IAM secret access key with s3 access.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "secretAccessKey" should be a string.',
      },
    },
    region: {
      type: 'string',
      description: 'AWS region the bucket is located in.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "region" should be a string.',
      },
    },
    bucket: {
      type: 'string',
      description: 'S3 bucket name.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "bucket" should be a string.',
      },
    },
    endpoint: {
      type: 'string',
      description:
        'Custom S3 API endpoint for S3-compatible providers (e.g. Cloudflare R2, MinIO, DigitalOcean Spaces, Backblaze B2, Wasabi).',
      errorMessage: {
        type: 'AwsS3Bucket connection property "endpoint" should be a string.',
      },
    },
    forcePathStyle: {
      type: 'boolean',
      description:
        'Force path-style bucket addressing (https://endpoint/bucket/key). Required by MinIO and some self-hosted S3-compatible setups.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "forcePathStyle" should be a boolean.',
      },
    },
    publicUrlBase: {
      type: 'string',
      description:
        'Base URL used to construct stable public object URLs (e.g. a CloudFront or CDN domain in front of the bucket). Used by download requests when the request sets "public: true".',
      errorMessage: {
        type: 'AwsS3Bucket connection property "publicUrlBase" should be a string.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the bucket.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the bucket.',
      errorMessage: {
        type: 'AwsS3Bucket connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'AwsS3Bucket connection properties should be an object.',
    required: {
      accessKeyId: 'AwsS3Bucket connection should have required property "accessKeyId".',
      secretAccessKey: 'AwsS3Bucket connection should have required property "secretAccessKey".',
      region: 'AwsS3Bucket connection should have required property "region".',
      bucket: 'AwsS3Bucket connection should have required property "bucket".',
    },
  },
};
