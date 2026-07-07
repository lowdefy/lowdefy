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
  title: 'Lowdefy Connection Schema - GoogleCloudStorageBucket',
  type: 'object',
  required: ['bucket'],
  properties: {
    bucket: {
      type: 'string',
      description: 'Google Cloud Storage bucket name.',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "bucket" should be a string.',
      },
    },
    client_email: {
      type: 'string',
      description:
        'The email of your service account. If omitted, Application Default Credentials are used.',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "client_email" should be a string.',
      },
    },
    private_key: {
      type: 'string',
      description:
        'The private key for your service account. If omitted, Application Default Credentials are used.',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "private_key" should be a string.',
      },
    },
    projectId: {
      type: 'string',
      description: 'The Google Cloud project ID the bucket belongs to.',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "projectId" should be a string.',
      },
    },
    publicUrlBase: {
      type: 'string',
      description:
        'Base URL used to construct stable public object URLs (e.g. a CDN domain in front of the bucket). Used by download requests when the request sets "public: true".',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "publicUrlBase" should be a string.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the bucket.',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the bucket.',
      errorMessage: {
        type: 'GoogleCloudStorageBucket connection property "write" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'GoogleCloudStorageBucket connection properties should be an object.',
    required: {
      bucket: 'GoogleCloudStorageBucket connection should have required property "bucket".',
    },
  },
};
