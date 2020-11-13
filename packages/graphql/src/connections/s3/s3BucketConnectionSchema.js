/*
  Copyright 2020 Lowdefy, Inc

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
