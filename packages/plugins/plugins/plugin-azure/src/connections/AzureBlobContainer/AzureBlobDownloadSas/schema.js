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
  title: 'Lowdefy Request Schema - AzureBlobDownloadSas',
  type: 'object',
  required: ['key'],
  properties: {
    contentDisposition: {
      type: 'string',
      description: 'Sets the Content-Disposition header of the response.',
      errorMessage: {
        type: 'AzureBlobDownloadSas request property "contentDisposition" should be a string.',
      },
    },
    contentType: {
      type: 'string',
      description: 'Sets the Content-Type header of the response.',
      errorMessage: {
        type: 'AzureBlobDownloadSas request property "contentType" should be a string.',
      },
    },
    expires: {
      type: 'number',
      description: 'Number of seconds for which the SAS token should be valid.',
      default: 3600,
      errorMessage: {
        type: 'AzureBlobDownloadSas request property "expires" should be a number.',
      },
    },
    key: {
      type: 'string',
      description: 'Key (blob name) under which the object is stored.',
      errorMessage: {
        type: 'AzureBlobDownloadSas request property "key" should be a string.',
      },
    },
    public: {
      type: 'boolean',
      default: false,
      description:
        'Return a stable, non-expiring public URL instead of a SAS URL. The blob must be publicly readable (public container access) — public is author-declared and never checked at runtime.',
      errorMessage: {
        type: 'AzureBlobDownloadSas request property "public" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'AzureBlobDownloadSas request properties should be an object.',
    required: 'AzureBlobDownloadSas request should have required property "key".',
  },
};
