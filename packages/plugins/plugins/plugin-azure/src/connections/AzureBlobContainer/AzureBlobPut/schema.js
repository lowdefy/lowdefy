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
  title: 'Lowdefy Request Schema - AzureBlobPut',
  type: 'object',
  required: ['key', 'content'],
  properties: {
    content: {
      type: 'string',
      description: 'Blob content as a base64 encoded string.',
      errorMessage: {
        type: 'AzureBlobPut request property "content" should be a string.',
      },
    },
    contentType: {
      type: 'string',
      description: 'MIME type of the blob (sets the Content-Type of the stored blob).',
      errorMessage: {
        type: 'AzureBlobPut request property "contentType" should be a string.',
      },
    },
    key: {
      type: 'string',
      description: 'Key (blob name) under which the blob will be stored.',
      errorMessage: {
        type: 'AzureBlobPut request property "key" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'AzureBlobPut request properties should be an object.',
    required: {
      key: 'AzureBlobPut request should have required property "key".',
      content: 'AzureBlobPut request should have required property "content".',
    },
  },
};
