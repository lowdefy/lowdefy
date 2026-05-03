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
  title: 'Lowdefy Request Schema - AwsS3PutObject',
  type: 'object',
  required: ['key', 'body'],
  properties: {
    key: {
      type: 'string',
      description: 'Key (or filename) under which the object will be stored.',
      errorMessage: {
        type: 'AwsS3PutObject request property "key" should be a string.',
      },
    },
    body: {
      type: 'string',
      description: 'Body of the object to write. Strings are uploaded as-is.',
      errorMessage: {
        type: 'AwsS3PutObject request property "body" should be a string.',
      },
    },
    contentType: {
      type: 'string',
      description: 'MIME type of the object. Defaults to "application/octet-stream".',
      errorMessage: {
        type: 'AwsS3PutObject request property "contentType" should be a string.',
      },
    },
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
      description: 'Access control list applied to the object.',
      errorMessage: {
        type: 'AwsS3PutObject request property "acl" should be a string.',
        enum: 'AwsS3PutObject request property "acl" is not one of the allowed S3 ACL values.',
      },
    },
    metadata: {
      type: 'object',
      description: 'User-defined metadata to attach to the object.',
      additionalProperties: { type: 'string' },
      errorMessage: {
        type: 'AwsS3PutObject request property "metadata" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'AwsS3PutObject request properties should be an object.',
    required: {
      key: 'AwsS3PutObject request should have required property "key".',
      body: 'AwsS3PutObject request should have required property "body".',
    },
  },
};
