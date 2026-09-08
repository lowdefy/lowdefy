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
  title: 'Lowdefy Connection Schema - AzureBlobContainer',
  type: 'object',
  required: ['account', 'accountKey', 'container'],
  properties: {
    account: {
      type: 'string',
      description: 'Azure storage account name.',
      errorMessage: {
        type: 'AzureBlobContainer connection property "account" should be a string.',
      },
    },
    accountKey: {
      type: 'string',
      description: 'Azure storage account access key.',
      errorMessage: {
        type: 'AzureBlobContainer connection property "accountKey" should be a string.',
      },
    },
    container: {
      type: 'string',
      description: 'Blob container name.',
      errorMessage: {
        type: 'AzureBlobContainer connection property "container" should be a string.',
      },
    },
    publicUrlBase: {
      type: 'string',
      description:
        'Base URL used to construct stable public object URLs (e.g. a CDN domain in front of the container). Used by download requests when the request sets "public: true".',
      errorMessage: {
        type: 'AzureBlobContainer connection property "publicUrlBase" should be a string.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the container.',
      errorMessage: {
        type: 'AzureBlobContainer connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the container.',
      errorMessage: {
        type: 'AzureBlobContainer connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'AzureBlobContainer connection properties should be an object.',
    required: {
      account: 'AzureBlobContainer connection should have required property "account".',
      accountKey: 'AzureBlobContainer connection should have required property "accountKey".',
      container: 'AzureBlobContainer connection should have required property "container".',
    },
  },
};
