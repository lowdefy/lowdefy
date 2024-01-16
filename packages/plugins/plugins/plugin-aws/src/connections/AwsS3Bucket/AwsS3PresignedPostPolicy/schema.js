/*
  Copyright 2020-2024 Lowdefy, Inc

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
  title: 'Lowdefy Request Schema - AwsS3PresignedPostPolicy',
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
        type: 'AwsS3PresignedPostPolicy request property "acl" should be a string.',
        enum: 'AwsS3PresignedPostPolicy request property "acl" is not one of "private", "public-read", "public-read-write", "aws-exec-read", "authenticated-read", "bucket-owner-read", "bucket-owner-full-control".',
      },
    },
    conditions: {
      type: 'array',
      items: {
        type: 'array',
      },
      description: 'Conditions to be enforced on the request.',
      errorMessage: {
        type: 'AwsS3PresignedPostPolicy request property "conditions" should be a array.',
      },
    },
    expires: {
      type: 'number',
      description: 'Number of seconds for which the policy should be valid.',
      default: 3600,
      errorMessage: {
        type: 'AwsS3PresignedPostPolicy request property "expires" should be a number.',
      },
    },
    key: {
      type: 'string',
      description: 'Key under which object will be stored.',
      errorMessage: {
        type: 'AwsS3PresignedPostPolicy request property "key" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'AwsS3PresignedPostPolicy request properties should be an object.',
    required: 'AwsS3PresignedPostPolicy request should have required property "key".',
  },
};
