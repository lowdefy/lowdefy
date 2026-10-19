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
  title: 'Lowdefy Request Schema - AwsS3DeleteObject',
  type: 'object',
  // An empty key makes the SDK send DELETE to the bucket itself, which S3 reads as DeleteBucket.
  properties: {
    key: {
      type: 'string',
      minLength: 1,
      description: 'Key of the object to delete. Give either key or keys.',
      errorMessage: {
        type: 'AwsS3DeleteObject request property "key" should be a string.',
        minLength: 'AwsS3DeleteObject request property "key" should not be empty.',
      },
    },
    keys: {
      type: 'array',
      minItems: 1,
      maxItems: 1000,
      items: {
        type: 'string',
        minLength: 1,
        errorMessage: {
          type: 'AwsS3DeleteObject request property "keys" should be an array of strings.',
          minLength: 'AwsS3DeleteObject request property "keys" should not hold an empty key.',
        },
      },
      description: 'Keys of the objects to delete, 1 to 1000. Give either key or keys.',
      errorMessage: {
        type: 'AwsS3DeleteObject request property "keys" should be an array of strings.',
        minItems: 'AwsS3DeleteObject request property "keys" should have at least 1 key.',
        maxItems: 'AwsS3DeleteObject request property "keys" should have at most 1000 keys.',
      },
    },
  },
  // The bucket always comes from the connection, so a stray "bucket" is refused rather than
  // ignored: ignoring it would delete the same key in the connection's bucket.
  additionalProperties: false,
  if: { type: 'object' },
  then: {
    oneOf: [
      { required: ['key'], not: { required: ['keys'] } },
      { required: ['keys'], not: { required: ['key'] } },
    ],
  },
  errorMessage: {
    type: 'AwsS3DeleteObject request properties should be an object.',
    additionalProperties: 'AwsS3DeleteObject request should only have "key" or "keys".',
    // The `then` above is the only check without a message of its own.
    _: 'AwsS3DeleteObject request should have either "key" or "keys", not both.',
  },
};
