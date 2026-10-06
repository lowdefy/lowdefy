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
      errorMessage: {
        type: 'AwsS3PutObject request property "acl" should be a string.',
        enum: 'AwsS3PutObject request property "acl" is not one of "private", "public-read", "public-read-write", "aws-exec-read", "authenticated-read", "bucket-owner-read", "bucket-owner-full-control".',
      },
    },
    content: {
      type: 'string',
      description: 'Object content as a base64 encoded string. Give either content or url.',
      errorMessage: {
        type: 'AwsS3PutObject request property "content" should be a string.',
      },
    },
    contentType: {
      type: 'string',
      description: 'MIME type of the object (sets the Content-Type of the stored object).',
      errorMessage: {
        type: 'AwsS3PutObject request property "contentType" should be a string.',
      },
    },
    contentTypes: {
      type: 'array',
      items: { type: 'string' },
      description:
        'With url, the content types the url may answer with, such as "image/png", "image/*" or "application/pdf". Any other is refused with code "content_type".',
      errorMessage: {
        type: 'AwsS3PutObject request property "contentTypes" should be an array of strings.',
      },
    },
    key: {
      type: 'string',
      description: 'Key under which the object will be stored.',
      errorMessage: {
        type: 'AwsS3PutObject request property "key" should be a string.',
      },
    },
    maxBytes: {
      type: 'integer',
      minimum: 1,
      description:
        'Required with url. The most bytes the url may answer with. A larger answer is refused with code "too_large" and nothing is stored.',
      errorMessage: {
        type: 'AwsS3PutObject request property "maxBytes" should be a positive integer.',
        minimum: 'AwsS3PutObject request property "maxBytes" should be a positive integer.',
      },
    },
    timeout: {
      type: 'integer',
      minimum: 1,
      default: 20000,
      description:
        'With url, the milliseconds the whole fetch and upload may take before it is refused with code "timeout".',
      errorMessage: {
        type: 'AwsS3PutObject request property "timeout" should be a positive integer.',
        minimum: 'AwsS3PutObject request property "timeout" should be a positive integer.',
      },
    },
    url: {
      type: 'string',
      description:
        'An https: link, such as a presigned link, whose answer is streamed into the bucket in place of content. Give either content or url.',
      errorMessage: {
        type: 'AwsS3PutObject request property "url" should be a string.',
      },
    },
  },
  if: { type: 'object' },
  then: {
    oneOf: [
      { required: ['content'], not: { required: ['url'] } },
      { required: ['url'], not: { required: ['content'] } },
    ],
  },
  dependencies: {
    url: ['maxBytes'],
    maxBytes: ['url'],
    contentTypes: ['url'],
    timeout: ['url'],
  },
  errorMessage: {
    type: 'AwsS3PutObject request properties should be an object.',
    required: {
      key: 'AwsS3PutObject request should have required property "key".',
    },
    // The `then` above is the only check without a message of its own.
    _: 'AwsS3PutObject request should have either "content" or "url", not both.',
    dependencies:
      'AwsS3PutObject request with "url" should have "maxBytes", and "maxBytes", "contentTypes" and "timeout" apply only with "url".',
  },
};
