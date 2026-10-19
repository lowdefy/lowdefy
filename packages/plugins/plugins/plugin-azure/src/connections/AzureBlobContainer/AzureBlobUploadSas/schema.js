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
  title: 'Lowdefy Request Schema - AzureBlobUploadSas',
  type: 'object',
  required: ['key'],
  properties: {
    contentType: {
      type: 'string',
      description: 'MIME type set as the Content-Type header of the upload.',
      errorMessage: {
        type: 'AzureBlobUploadSas request property "contentType" should be a string.',
      },
    },
    expires: {
      type: 'number',
      description: 'Number of seconds for which the SAS token should be valid.',
      default: 3600,
      errorMessage: {
        type: 'AzureBlobUploadSas request property "expires" should be a number.',
      },
    },
    key: {
      type: 'string',
      description: 'Key (blob name) under which the object will be stored.',
      errorMessage: {
        type: 'AzureBlobUploadSas request property "key" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'AzureBlobUploadSas request properties should be an object.',
    required: 'AzureBlobUploadSas request should have required property "key".',
  },
};
